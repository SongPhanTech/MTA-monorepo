import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import LectureTreeSelect from "@components/commons/lecture-select-multi/TreeSelectLecture"
import Select from "@components/commons/select"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { CopyOutlined, DownOutlined } from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import { sqlTransaction } from "@workspace/libs/api/model"
import { formatLecturerName } from "@workspace/libs/utils"
import { $Enums } from "@workspace/db/client"
import { dayjs } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Flex, Form, message, Switch, Tooltip, TreeSelect, Row } from "antd"
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

type LecturerNameStore = {
  get: (id?: string | null) => string
  register: (id: string, name: string) => void
}

const LecturerNameContext = createContext<LecturerNameStore>({
  get: () => "",
  register: () => {},
})

const CopySourceContext = createContext<string | null>(null)

export function CopySourceProvider({
  value,
  children,
}: {
  value: string | null
  children: ReactNode
}) {
  return <CopySourceContext.Provider value={value}>{children}</CopySourceContext.Provider>
}

export function LecturerNameProvider({
  seed,
  children,
}: {
  seed?: Array<[string, string]>
  children: ReactNode
}) {
  const mapRef = useRef(new Map<string, string>())

  if (seed?.length) {
    for (const [id, name] of seed) {
      if (id && name && !mapRef.current.has(id)) {
        mapRef.current.set(id, name)
      }
    }
  }

  const store = useMemo<LecturerNameStore>(
    () => ({
      get: (id) => (id ? mapRef.current.get(id) || "" : ""),
      register: (id, name) => {
        if (id && name) mapRef.current.set(id, name)
      },
    }),
    []
  )

  return <LecturerNameContext.Provider value={store}>{children}</LecturerNameContext.Provider>
}

export function getAssignmentRowClass(record?: object | null) {
  const row = record as {
    $type?: string
    cancelled?: boolean | null
    approveLecturerAssignmentAt?: Date | string | null
    submitLecturerAssignmentAt?: Date | string | null
    lecturerId?: string | null
    enterGradeLecturerId?: string | null
  } | null
  if (row?.$type === "parent") return "bg-white"
  if (row?.cancelled) return "bg-red-200"
  if (row?.approveLecturerAssignmentAt) return "bg-green-200"
  if (row?.submitLecturerAssignmentAt) return "bg-yellow-200"
  if (!row?.lecturerId || !row?.enterGradeLecturerId) return "bg-slate-200"
  return ""
}

type LecturerLike = {
  userProfile?: {
    code?: string | null
    fullname?: string | null
    academicRankType?: { sMa?: string | null } | null
    academicDegreeType?: { sMa?: string | null } | null
  } | null
} | null

type InjectedField<T> = {
  value?: T
  onChange?: (value: T) => void
}

function FieldTrigger({
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
        "flex h-8 w-full items-center justify-between gap-1 rounded-md border border-[#d9d9d9] bg-white px-2 text-left text-sm",
        !disabled && "hover:border-[#4096ff] cursor-pointer",
        disabled && "cursor-not-allowed bg-[#f5f5f5] text-black/25"
      )}
      onClick={() => {
        if (!disabled) onOpen()
      }}
    >
      <span className={cn("min-w-0 truncate", !label && "text-gray-400")}>
        {label || placeholder}
      </span>
      <DownOutlined className="shrink-0 text-[10px] text-black/25" />
    </button>
  )
}

const LazyDateField = memo(function LazyDateField({
  value,
  onChange,
  disabled,
  fallback,
}: InjectedField<Dayjs | null> & {
  disabled?: boolean
  fallback?: string
}) {
  const [editing, setEditing] = useState(false)
  const display = value ? dayjs(value).format("DD/MM/YYYY") : fallback || ""

  if (editing && !disabled) {
    return (
      <DatePicker
        suffixIcon={null}
        className="px-1"
        placeholder="Chọn ngày"
        autoFocus
        defaultOpen
        value={value ?? undefined}
        onChange={(next) => onChange?.(next)}
        onOpenChange={(open) => {
          if (!open) setEditing(false)
        }}
      />
    )
  }

  return (
    <FieldTrigger
      disabled={disabled}
      label={display}
      placeholder="Chọn ngày"
      onOpen={() => setEditing(true)}
    />
  )
})

const LazyOptionsField = memo(function LazyOptionsField({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  fallback,
  allowClear,
  showSearch,
  dropdownWidth,
}: InjectedField<string | null> & {
  options: { label: ReactNode; value: string | number }[]
  disabled?: boolean
  placeholder?: string
  fallback?: ReactNode
  allowClear?: boolean
  showSearch?: boolean
  dropdownWidth?: number
}) {
  const [editing, setEditing] = useState(false)
  const label = options.find((item) => item.value === value)?.label ?? fallback

  if (editing && !disabled) {
    return (
      <Select
        value={value ?? undefined}
        options={options}
        allowClear={allowClear}
        showSearch={showSearch}
        autoFocus
        defaultOpen
        filterOption={
          showSearch
            ? (input, option) =>
                (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
            : undefined
        }
        dropdownStyle={dropdownWidth ? { width: dropdownWidth, maxHeight: 400 } : undefined}
        onChange={onChange}
        onDropdownVisibleChange={(open) => {
          if (!open) setEditing(false)
        }}
      />
    )
  }

  return (
    <FieldTrigger
      disabled={disabled}
      label={label}
      placeholder={placeholder}
      onOpen={() => setEditing(true)}
    />
  )
})

const LazyLecturerField = memo(function LazyLecturerField({
  value,
  onChange,
  disabled,
  fallbackName,
  organizationId,
  ignoreLectureIds,
}: InjectedField<string | null> & {
  disabled?: boolean
  fallbackName?: string
  organizationId?: string | null
  ignoreLectureIds?: string[]
}) {
  const names = useContext(LecturerNameContext)
  const [editing, setEditing] = useState(false)
  const label = (value && names.get(value)) || fallbackName || ""

  if (editing && !disabled) {
    return (
      <LectureTreeSelect
        placeholder="Chọn giảng viên"
        ignoreLectureIds={ignoreLectureIds}
        organizationId={organizationId}
        defaultOpen
        autoFocus
        value={value ?? undefined}
        onChange={(next, labelList) => {
          const nextId = typeof next === "string" ? next : null
          const rawLabel = Array.isArray(labelList) ? labelList[0] : labelList
          if (nextId && typeof rawLabel === "string") {
            names.register(nextId, rawLabel)
          }
          onChange?.(nextId)
        }}
        onDropdownVisibleChange={(open) => {
          if (!open) setEditing(false)
        }}
      />
    )
  }

  return (
    <FieldTrigger
      disabled={disabled}
      label={label}
      placeholder="Chọn giảng viên"
      onOpen={() => setEditing(true)}
    />
  )
})

const LazyRoomField = memo(function LazyRoomField({
  value,
  onChange,
  disabled,
  treeData,
}: InjectedField<string | null> & {
  disabled?: boolean
  treeData: any[]
}) {
  const [editing, setEditing] = useState(false)
  const roomLabel = useMemo(() => {
    if (!value) return ""
    for (const building of treeData) {
      const room = building.children?.find((item: any) => item.value === value)
      if (room) return room.label || room.filterValue
    }
    return ""
  }, [value, treeData])

  if (editing && !disabled) {
    return (
      <TreeSelect
        value={value ?? undefined}
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
        onChange={(next) => onChange?.((next as string) ?? null)}
        onDropdownVisibleChange={(open) => {
          if (!open) setEditing(false)
        }}
      />
    )
  }

  return (
    <FieldTrigger
      disabled={disabled}
      label={roomLabel}
      placeholder="Chọn phòng"
      onOpen={() => setEditing(true)}
    />
  )
})

export const AssignmentRowPaint = memo(function AssignmentRowPaint({
  recordId,
  submitLecturerAssignmentAt,
  approveLecturerAssignmentAt,
  isParent,
  cancelled,
}: {
  recordId: string
  submitLecturerAssignmentAt?: Date | string | null
  approveLecturerAssignmentAt?: Date | string | null
  isParent?: boolean
  cancelled?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const copySourceId = useContext(CopySourceContext)
  const lecturerId = Form.useWatch(["subjectClass", recordId, "lecturerId"], form)
  const enterGradeLecturerId = Form.useWatch(
    ["subjectClass", recordId, "enterGradeLecturerId"],
    form
  )
  const isEdit = Form.useWatch(["subjectClass", recordId, "isEdit"], form)

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
  cancelled,
}: {
  recordId: string
  canEdit: boolean
  lecturerAssignmentDeadline?: Date | string | null
  approveLecturerAssignmentAt?: Date | string | null
  cancelled?: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const disabled = cancelled || !!approveLecturerAssignmentAt

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
      <LazyDateField
        disabled={disabled}
        fallback={
          lecturerAssignmentDeadline ? dayjs(lecturerAssignmentDeadline).format("DD/MM/YYYY") : ""
        }
      />
    </FormItem>
  )
})

export const ScheduleCell = memo(function ScheduleCell({
  recordId,
  options,
  cancelled,
}: {
  recordId: string
  options: { label: string; value: string }[]
  cancelled?: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()

  return (
    <FormItem form={form} name={["subjectClass", recordId, "schedule"]}>
      <LazyOptionsField options={options} disabled={cancelled} placeholder="Chọn kíp" />
    </FormItem>
  )
})

export const LockLecturerCell = memo(function LockLecturerCell({
  recordId,
  logText,
  refetch,
  cancelled,
}: {
  recordId: string
  logText: string
  refetch: () => void
  cancelled?: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const { showSpinner, hideSpinner } = useSpinner()

  if (!recordId) return null

  return (
    <Flex vertical align="center" className="gap-1">
      <Tooltip title={logText || "Chưa có lịch sử khóa"}>
        <FormItem
          form={form}
          name={["subjectClass", recordId, "isLockLecturer"]}
          valuePropName="checked"
          className="m-0"
        >
          <Switch
            checkedChildren="Khóa"
            unCheckedChildren="Mở"
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
                form.setFieldValue(["subjectClass", recordId, "isLockLecturer"], checked)
                form.setFieldValue(["subjectClass", recordId, "isEdit"], false)
                refetch()
              } catch (err: any) {
                message.error(err?.message || "Không thể cập nhật trạng thái khóa")
              } finally {
                hideSpinner()
              }
            }}
          />
        </FormItem>
      </Tooltip>
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
  cancelled,
}: {
  recordId: string
  field: "lecturerId" | "extraLecturerId" | "enterGradeLecturerId"
  ignoreField?: "lecturerId" | "extraLecturerId"
  organizationId?: string | null
  lecturer?: LecturerLike
  canShowSelect: boolean
  deadlinePassed: boolean
  cancelled?: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const isLockLecturer = Form.useWatch(["subjectClass", recordId, "isLockLecturer"], form) ?? true
  const ignoreId = ignoreField
    ? Form.useWatch(["subjectClass", recordId, ignoreField], form)
    : undefined
  const ignoreLectureIds = useMemo(() => {
    if (!ignoreField || !ignoreId || typeof ignoreId !== "string") return EMPTY_IDS
    return [ignoreId]
  }, [ignoreField, ignoreId])

  const label = formatLecturerName(lecturer)

  if (cancelled || !canShowSelect) {
    return label
  }

  return (
    <FormItem form={form} name={["subjectClass", recordId, field]}>
      <LazyLecturerField
        disabled={deadlinePassed || isLockLecturer}
        fallbackName={label}
        organizationId={organizationId}
        ignoreLectureIds={field === "enterGradeLecturerId" ? undefined : ignoreLectureIds}
      />
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
  const disabled =
    !!cancelled ||
    hasGradedStudent ||
    (khoaBoMon && (!!submitLecturerAssignmentAt || deadlinePassed))

  return (
    <FormItem form={form} name={["subjectClass", recordId, "examType"]}>
      <LazyOptionsField
        options={options}
        disabled={disabled}
        placeholder="Chọn hình thức"
        fallback={initialValue}
        dropdownWidth={250}
      />
    </FormItem>
  )
})

export const LocationCell = memo(function LocationCell({
  recordId,
  options,
  canEdit,
  trainingLocationName,
  cancelled,
}: {
  recordId: string
  options: { label: string; value: string }[]
  canEdit: boolean
  trainingLocationName?: string | null
  cancelled?: boolean
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()

  if (!canEdit) return trainingLocationName || "-"

  return (
    <FormItem form={form} name={["subjectClass", recordId, "trainingLocationId"]}>
      <LazyOptionsField
        options={options}
        disabled={cancelled}
        placeholder="Chọn khu vực"
        fallback={trainingLocationName}
        allowClear
        showSearch
        dropdownWidth={400}
      />
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
  const trainingLocationId = Form.useWatch(["subjectClass", recordId, "trainingLocationId"], form)
  const treeData = trainingLocationId ? (treeDataByLocation[trainingLocationId] ?? []) : []
  const disabled =
    !!cancelled || (khoaBoMon && (!!submitLecturerAssignmentAt || deadlinePassed))

  return (
    <FormItem form={form} name={["subjectClass", recordId, "roomId"]}>
      <LazyRoomField disabled={disabled} treeData={treeData} />
    </FormItem>
  )
})

export const ActionsCell = memo(function ActionsCell({
  recordId,
  cancelled,
  status,
  canEdit,
  canDelete,
  onCopyToggle,
  onEdit,
  onDelete,
}: {
  recordId: string
  cancelled?: boolean
  status?: $Enums.SubjectClassStatus
  canEdit: boolean
  canDelete: boolean
  onCopyToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const form = Form.useFormInstance<TeachingAssignmentForm>()
  const copySourceId = useContext(CopySourceContext)
  const lecturerId = Form.useWatch(["subjectClass", recordId, "lecturerId"], form)
  const canTriggerCopy = !!(lecturerId && !cancelled)

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
