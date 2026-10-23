import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import LectureTreeSelect from "@components/commons/lecture-select-multi/TreeSelectLecture"
import Select from "@components/commons/select"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { CopyOutlined } from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import { sqlTransaction } from "@workspace/libs/api/model"
import { formatLecturerName } from "@workspace/libs/utils"
import { $Enums } from "@workspace/db/client"
import { useFindManyLecturer } from "@workspace/db/hooks"
import { dayjs } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Flex, Form, message, Switch, Tooltip, TreeSelect, Row } from "antd"
import type { FormInstance } from "antd/es/form"
import type { Dayjs } from "dayjs"
import {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

export type TeachingAssignmentForm = {
  subjectClass: Record<
    string,
    {
      schedule: $Enums.SubjectClassSchedule | null
      lecturerId: string | null
      extraLecturerId: string | null
      enterGradeLecturerId: string | null
      lecturerAssignmentDeadline: Dayjs | null
      examType: $Enums.ExamType | null
      roomId: string | null
      trainingLocationId: string | null
      maxStudent: number | null
      isEdit?: boolean
      cancelled: boolean
      isLockLecturer: boolean
    }
  >
}

const EMPTY_IDS: string[] = []
const ROW_PAINT_CLASSES = [
  "bg-yellow-200",
  "bg-slate-200",
  "bg-green-200",
  "bg-yellow-100",
  "bg-red-200",
  "bg-white",
  "bg-blue-100",
  "border-l-2",
  "border-blue-400",
]

const LecturerNameContext = createContext<Map<string, string>>(new Map())

export function LecturerNameProvider({ children }: { children: ReactNode }) {
  const { data: lecturers = [] } = useFindManyLecturer(
    {
      include: {
        userProfile: {
          select: {
            id: true,
            code: true,
            fullname: true,
            sDM_DonViId: true,
            academicRankType: true,
            academicDegreeType: true,
          },
        },
      },
      where: {
        userProfile: { active: true },
        active: true,
      },
    },
    { refetchOnWindowFocus: false }
  )

  const map = useMemo(() => {
    const next = new Map<string, string>()
    for (const lecturer of lecturers) {
      next.set(lecturer.id, formatLecturerName(lecturer))
    }
    return next
  }, [lecturers])

  return <LecturerNameContext.Provider value={map}>{children}</LecturerNameContext.Provider>
}

export function FormStateGate({
  form,
  children,
}: {
  form: FormInstance<TeachingAssignmentForm>
  children: (state: { hasUnsavedEdits: boolean; missingTrainingLocation: boolean }) => ReactNode
}) {
  return (
    <Form.Item noStyle shouldUpdate>
      {() => {
        const values = Object.values(form.getFieldValue("subjectClass") || {})
        return children({
          hasUnsavedEdits: values.some((item: any) => item?.isEdit),
          missingTrainingLocation: values.some((item: any) => !item?.trainingLocationId),
        })
      }}
    </Form.Item>
  )
}

type LecturerLike = {
  userProfile?: {
    code?: string | null
    fullname?: string | null
    academicRankType?: { sMa?: string | null } | null
    academicDegreeType?: { sMa?: string | null } | null
  } | null
} | null

function useRowForm(recordId: string) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const cancelled = Form.useWatch(["subjectClass", recordId, "cancelled"], form)
  const isLockLecturer = Form.useWatch(["subjectClass", recordId, "isLockLecturer"], form)
  return { form, cancelled, isLockLecturer: isLockLecturer ?? true }
}

function LazyTrigger({
  disabled,
  label,
  placeholder,
  onOpen,
}: {
  disabled?: boolean
  label?: ReactNode
  placeholder?: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "w-full min-h-8 px-1 text-left text-sm truncate rounded border border-transparent bg-transparent",
        !disabled && "hover:border-[#d9d9d9] hover:bg-white cursor-pointer",
        disabled && "cursor-not-allowed opacity-70"
      )}
      onClick={() => {
        if (!disabled) onOpen()
      }}
    >
      {label ? label : <span className="text-gray-400">{placeholder}</span>}
    </button>
  )
}

export const AssignmentRowPaint = memo(function AssignmentRowPaint({
  recordId,
  submitLecturerAssignmentAt,
  approveLecturerAssignmentAt,
  isParent,
  copySourceId,
}: {
  recordId: string
  submitLecturerAssignmentAt?: Date | string | null
  approveLecturerAssignmentAt?: Date | string | null
  isParent?: boolean
  copySourceId: string | null
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const lecturerId = Form.useWatch(["subjectClass", recordId, "lecturerId"], form)
  const enterGradeLecturerId = Form.useWatch(
    ["subjectClass", recordId, "enterGradeLecturerId"],
    form
  )
  const isEdit = Form.useWatch(["subjectClass", recordId, "isEdit"], form)
  const cancelled = Form.useWatch(["subjectClass", recordId, "cancelled"], form)

  useLayoutEffect(() => {
    const row = ref.current?.closest("tr")
    if (!row) return
    row.classList.remove(...ROW_PAINT_CLASSES)
    if (isParent) {
      row.classList.add("bg-white")
      return
    }
    if (cancelled) row.classList.add("bg-red-200")
    else if (approveLecturerAssignmentAt) row.classList.add("bg-green-200")
    else if (isEdit) row.classList.add("bg-yellow-100")
    else if (submitLecturerAssignmentAt) row.classList.add("bg-yellow-200")
    else if (!lecturerId || !enterGradeLecturerId) row.classList.add("bg-slate-200")
    if (recordId === copySourceId) row.classList.add("bg-blue-100", "border-l-2", "border-blue-400")
  }, [
    approveLecturerAssignmentAt,
    cancelled,
    copySourceId,
    enterGradeLecturerId,
    isEdit,
    isParent,
    lecturerId,
    recordId,
    submitLecturerAssignmentAt,
  ])

  return <span ref={ref} className="hidden" />
})

export const DeadlineCell = memo(function DeadlineCell({
  recordId,
  canEdit,
  lecturerAssignmentDeadline,
  approveLecturerAssignmentAt,
}: {
  recordId: string
  canEdit: boolean
  lecturerAssignmentDeadline?: Date | string | null
  approveLecturerAssignmentAt?: Date | string | null
}) {
  const { form, cancelled } = useRowForm(recordId)
  const value = Form.useWatch(["subjectClass", recordId, "lecturerAssignmentDeadline"], form)
  const [editing, setEditing] = useState(false)
  const disabled = cancelled || !!approveLecturerAssignmentAt
  const display = value ? dayjs(value).format("DD/MM/YYYY") : lecturerAssignmentDeadline
    ? dayjs(lecturerAssignmentDeadline).format("DD/MM/YYYY")
    : ""

  if (!canEdit) {
    if (!lecturerAssignmentDeadline) return ""
    return (
      <p
        className={cn(
          dayjs(lecturerAssignmentDeadline).isBefore(dayjs().startOf("day")) && "text-red-600"
        )}
      >
        {dayjs(lecturerAssignmentDeadline).format("DD/MM/YYYY")}
      </p>
    )
  }

  return (
    <FormItem form={form} name={["subjectClass", recordId, "lecturerAssignmentDeadline"]}>
      {editing && !disabled ? (
        <DatePicker
          suffixIcon={null}
          className="px-1"
          placeholder="Chọn ngày"
          autoFocus
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={disabled}
          label={display}
          placeholder="Chọn ngày"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const ScheduleCell = memo(function ScheduleCell({
  recordId,
  options,
}: {
  recordId: string
  options: { label: string; value: string }[]
}) {
  const { form, cancelled } = useRowForm(recordId)
  const value = Form.useWatch(["subjectClass", recordId, "schedule"], form)
  const [editing, setEditing] = useState(false)
  const label = options.find((item) => item.value === value)?.label

  return (
    <FormItem form={form} name={["subjectClass", recordId, "schedule"]}>
      {editing && !cancelled ? (
        <Select
          options={options}
          allowClear={false}
          autoFocus
          defaultOpen
          onDropdownVisibleChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={cancelled}
          label={label}
          placeholder="Chọn kíp"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const LockLecturerCell = memo(function LockLecturerCell({
  recordId,
  logText,
  refetch,
}: {
  recordId: string
  logText: string
  refetch: () => void
}) {
  const { form, cancelled, isLockLecturer } = useRowForm(recordId)
  const { showSpinner, hideSpinner } = useSpinner()
  const row = Form.useWatch(["subjectClass", recordId], form)

  if (!recordId || !row) return null

  return (
    <Flex vertical align="center" className="gap-1">
      <FormItem
        form={form}
        name={["subjectClass", recordId, "isLockLecturer"]}
        valuePropName="checked"
        className="m-0"
      >
        <Tooltip title={logText || "Chưa có lịch sử khóa"}>
          <Switch
            checkedChildren="Khóa"
            unCheckedChildren="Mở"
            checked={isLockLecturer}
            disabled={cancelled}
            onChange={async (checked) => {
              try {
                showSpinner()
                await sqlTransaction([
                  {
                    model: "SubjectClass",
                    operation: "update",
                    data: {
                      where: { id: recordId },
                      data: { isLockLecturer: checked },
                    },
                  },
                ])
                message.success(
                  checked ? "Đã khóa phân công giảng viên" : "Đã mở khóa phân công giảng viên"
                )

                const current = form.getFieldValue(["subjectClass", recordId])
                form.setFieldValue(["subjectClass", recordId], {
                  ...current,
                  isLockLecturer: checked,
                  isEdit: false,
                })

                refetch()
              } catch (err: any) {
                message.error(err?.message || "Không thể cập nhật trạng thái khóa")
              } finally {
                hideSpinner()
              }
            }}
          />
        </Tooltip>
      </FormItem>
    </Flex>
  )
})

export const LecturerCell = memo(function LecturerCell({
  recordId,
  field,
  ignoreField,
  organizationId,
  lecturer,
  canShowSelect,
  deadlinePassed,
}: {
  recordId: string
  field: "lecturerId" | "extraLecturerId" | "enterGradeLecturerId"
  ignoreField?: "lecturerId" | "extraLecturerId"
  organizationId?: string | null
  lecturer?: LecturerLike
  canShowSelect: boolean
  deadlinePassed: boolean
}) {
  const { form, cancelled, isLockLecturer } = useRowForm(recordId)
  const value = Form.useWatch(["subjectClass", recordId, field], form)
  const ignoreId = Form.useWatch(["subjectClass", recordId, ignoreField ?? "cancelled"], form)
  const names = useContext(LecturerNameContext)
  const [editing, setEditing] = useState(false)

  const ignoreLectureIds = useMemo(() => {
    if (!ignoreField || !ignoreId || typeof ignoreId !== "string") return EMPTY_IDS
    return [ignoreId]
  }, [ignoreField, ignoreId])

  const label =
    (value && names.get(value)) || formatLecturerName(lecturer) || ""
  const disabled = deadlinePassed || isLockLecturer

  if (cancelled || !canShowSelect) {
    return formatLecturerName(lecturer) || label
  }

  return (
    <FormItem form={form} name={["subjectClass", recordId, field]}>
      {editing && !disabled ? (
        <LectureTreeSelect
          placeholder="Chọn giảng viên"
          ignoreLectureIds={field === "enterGradeLecturerId" ? undefined : ignoreLectureIds}
          organizationId={organizationId}
          defaultOpen
          autoFocus
          onDropdownVisibleChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={disabled}
          label={label}
          placeholder="Chọn giảng viên"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const ExamTypeCell = memo(function ExamTypeCell({
  recordId,
  options,
  cancelled,
  hasGradedStudent,
  khoaBoMon,
  submitLecturerAssignmentAt,
  deadlinePassed,
  initialValue,
}: {
  recordId: string
  options: { label: ReactNode; value: string | number }[]
  cancelled?: boolean
  hasGradedStudent: boolean
  khoaBoMon: boolean
  submitLecturerAssignmentAt?: Date | string | null
  deadlinePassed: boolean
  initialValue?: string
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const value = Form.useWatch(["subjectClass", recordId, "examType"], form)
  const [editing, setEditing] = useState(false)
  const disabled =
    !!cancelled ||
    hasGradedStudent ||
    (khoaBoMon && (!!submitLecturerAssignmentAt || deadlinePassed))
  const label = options.find((item) => item.value === value)?.label ?? initialValue

  return (
    <FormItem form={form} name={["subjectClass", recordId, "examType"]} initialValue={initialValue}>
      {editing && !disabled ? (
        <Select
          dropdownStyle={{ width: 250 }}
          options={options}
          autoFocus
          defaultOpen
          onDropdownVisibleChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={disabled}
          label={label}
          placeholder="Chọn hình thức"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const LocationCell = memo(function LocationCell({
  recordId,
  options,
  canEdit,
  trainingLocationName,
}: {
  recordId: string
  options: { label: string; value: string }[]
  canEdit: boolean
  trainingLocationName?: string | null
}) {
  const { form, cancelled } = useRowForm(recordId)
  const value = Form.useWatch(["subjectClass", recordId, "trainingLocationId"], form)
  const [editing, setEditing] = useState(false)
  const label = options.find((item) => item.value === value)?.label || trainingLocationName

  if (!canEdit) return trainingLocationName || "-"

  return (
    <FormItem form={form} name={["subjectClass", recordId, "trainingLocationId"]}>
      {editing && !cancelled ? (
        <Select
          options={options}
          allowClear
          showSearch
          autoFocus
          defaultOpen
          filterOption={(input, option) =>
            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
          }
          dropdownStyle={{ width: 400, maxHeight: 400 }}
          onDropdownVisibleChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={cancelled}
          label={label}
          placeholder="Chọn khu vực"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const RoomCell = memo(function RoomCell({
  recordId,
  treeDataByLocation,
  cancelled,
  khoaBoMon,
  submitLecturerAssignmentAt,
  deadlinePassed,
}: {
  recordId: string
  treeDataByLocation: Record<string, any[]>
  cancelled?: boolean
  khoaBoMon: boolean
  submitLecturerAssignmentAt?: Date | string | null
  deadlinePassed: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const formCancelled = Form.useWatch(["subjectClass", recordId, "cancelled"], form)
  const trainingLocationId = Form.useWatch(["subjectClass", recordId, "trainingLocationId"], form)
  const roomId = Form.useWatch(["subjectClass", recordId, "roomId"], form)
  const [editing, setEditing] = useState(false)
  const treeData = trainingLocationId ? (treeDataByLocation[trainingLocationId] ?? []) : []
  const disabled =
    !!(formCancelled ?? cancelled) ||
    (khoaBoMon && (!!submitLecturerAssignmentAt || deadlinePassed))

  const roomLabel = useMemo(() => {
    if (!roomId) return ""
    for (const building of treeData) {
      const room = building.children?.find((item: any) => item.value === roomId)
      if (room) return room.label || room.filterValue
    }
    return ""
  }, [roomId, treeData])

  return (
    <FormItem form={form} name={["subjectClass", recordId, "roomId"]}>
      {editing && !disabled ? (
        <TreeSelect
          treeData={treeData}
          filterTreeNode={(input, option) =>
            ((option as any)?.filterValue ?? "").toLowerCase().includes(input?.toLowerCase())
          }
          showSearch
          allowClear
          autoFocus
          defaultOpen
          treeNodeFilterProp="title"
          treeNodeLabelProp="label"
          multiple={false}
          treeExpandAction="click"
          showCheckedStrategy="SHOW_CHILD"
          dropdownStyle={{ width: 400, maxHeight: 400 }}
          onDropdownVisibleChange={(open) => {
            if (!open) setEditing(false)
          }}
        />
      ) : (
        <LazyTrigger
          disabled={disabled}
          label={roomLabel}
          placeholder="Chọn phòng"
          onOpen={() => setEditing(true)}
        />
      )}
    </FormItem>
  )
})

export const ActionsCell = memo(function ActionsCell({
  recordId,
  cancelled,
  status,
  copySourceId,
  canEdit,
  canDelete,
  onCopyToggle,
  onEdit,
  onDelete,
}: {
  recordId: string
  cancelled?: boolean
  status?: $Enums.SubjectClassStatus
  copySourceId: string | null
  canEdit: boolean
  canDelete: boolean
  onCopyToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const lecturerId = Form.useWatch(["subjectClass", recordId, "lecturerId"], form)
  const formCancelled = Form.useWatch(["subjectClass", recordId, "cancelled"], form)
  const canTriggerCopy = !!(lecturerId && !(formCancelled ?? cancelled))

  if (cancelled) return null
  if (!recordId) return ""

  return (
    <Row className="justify-center gap-2">
      <Tooltip
        title={
          canTriggerCopy
            ? copySourceId === recordId
              ? "Đang chọn làm nguồn copy — nhấn để bỏ"
              : "Copy PCGV"
            : "Dòng này chưa có GV 1"
        }
      >
        <CopyOutlined
          onClick={() => {
            if (!canTriggerCopy) return
            onCopyToggle(recordId)
          }}
          className={cn(
            "text-sm cursor-pointer",
            !canTriggerCopy && "text-gray-300 cursor-not-allowed",
            copySourceId === recordId ? "text-blue-600" : "text-gray-600"
          )}
        />
      </Tooltip>
      {canEdit && (
        <EditIcon onClick={() => onEdit(recordId)} className="text-sm text-blue-700 cursor-pointer" />
      )}
      {canDelete && (
        <DeleteIcon
          popConfirm={{
            onConfirm: () => onDelete(recordId),
          }}
          disabled={status !== $Enums.SubjectClassStatus.DRAFT}
        />
      )}
    </Row>
  )
})

export function FixedClassCodes({ codes }: { codes?: Array<{ code?: string | null } | null> }) {
  if (!codes?.length) return null
  return (
    <p className="text-left">
      {codes.map((e, idx) => (
        <p key={e?.code ?? idx}>{e?.code}</p>
      ))}
    </p>
  )
}

export function SubjectNameCell({
  name,
  credit,
}: {
  name?: string | null
  credit?: number | null
}): ReactNode {
  return (
    <p className="text-left">
      {name} ({credit} TC)
    </p>
  )
}
