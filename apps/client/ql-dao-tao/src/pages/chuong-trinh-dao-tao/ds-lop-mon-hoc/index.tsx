import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DownloadOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { cn } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import { $Enums, type Prisma, type SubjectVersion } from "@workspace/db/client"
import {
  useCountSubjectClass,
  useDeleteSubjectClass,
  useFindManyFixedClass,
  useFindManySubjectClass,
} from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import {
  setExamScoreDeadLine,
  setScoreDeadLine,
  useCreateExams,
} from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  DatePicker as AntdDatePicker,
  Button,
  Checkbox,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Popover,
  Row,
  Switch,
  Tag,
  Tooltip,
} from "antd"
import locale from "antd/es/date-picker/locale/vi_VN"
import dayjs from "dayjs"
import { type Dayjs } from "dayjs"
import _ from "lodash"
import { CalendarPlus, Search } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { diemLopMonHocStore } from "../../quan-ly-diem/ql-diem-lop-mon-hoc"
import { sqlTransaction } from "@workspace/libs/api/model"
import { saveAs } from "file-saver"
import { exportSubjectClassListExcel } from "@workspace/libs/api/training"
import PutSubjectClassModal from "@components/modal/put-ds-mon-hoc"

type DisclosurePayload = {
  id?: string
  thesisExpert?: boolean
  mode?: "create" | "edit"
  trainingObjectTypeId?: string
  semesterId?: string
}

type TimeScore = {
  time: [Dayjs, Dayjs]
  startPadding: number
  endPadding: number
  overwrite: boolean
}
type TimeScoreExam = {
  endDate: Dayjs
  endPadding: number
  overwrite: boolean
}

type HoldAnExam = {
  isGroupBySubject: boolean
}

export default function ClassSubject() {
  const { canSome, can } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { options, getExamTypeLabel } = useExamTypeOptions()
  const [open, setOpen] = useState(false)
  const [openExam, setOpenExam] = useState(false)
  const [openHoldAnExam, setOpenHoldAnExam] = useState(false)
  const [form] = Form.useForm<TimeScore>()
  const [formExam] = Form.useForm<TimeScoreExam>()
  const [formHoldAnExam] = Form.useForm<HoldAnExam>()
  const [changedExamDates, setChangedExamDates] = useState<Record<string, string | null>>({})
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    code: "",
    name: "",
    examType: undefined,
    schoolYearId: undefined,
    semesterId: undefined,
    startDate: undefined,
    endDate: undefined,
    examDate: undefined,
    credit: undefined,
    mainLecturer: undefined,
    enterGradeLecturer: undefined,
    fixedClassId: undefined,
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()

  const { onOpen } = useDisclosure<DisclosurePayload>({
    tag: "PutSubjectClassModal",
    onClose: () => {
      debouncedRefetch()
    },
  })

  const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const canReadAll = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "XEM_TAT_CA")

  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: {
        ...((trainingObjectTypeId || semesterId) && {
          trainingCourse: {
            ...(trainingObjectTypeId && { trainingObjectTypeId }),
            ...(semesterId && { semesterStartId: semesterId }),
          },
        }),
      },
      include: {
        trainingCourse: {
          include: {
            trainingObjectType: true,
            semesterStart: true,
          },
        },
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!trainingObjectTypeId || !!semesterId,
    }
  )

  const where = useMemo(() => {
    return {
      ...(semesterId ? { semesterId } : {}),
      ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              { name: { contains: filters.searchText, mode: "insensitive" } },
              { code: { contains: filters.searchText, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.code && filters.code !== ""
        ? { code: { contains: filters.searchText || filters.code, mode: "insensitive" } }
        : {}),
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name, mode: "insensitive" } }
        : {}),
      ...(filters.fixedClassId ? { fixedClasses: { some: { id: filters.fixedClassId } } } : {}),
      ...(filters.mainLecturer
        ? {
            mainLecturer: {
              userProfile: {
                fullname: { contains: filters.mainLecturer, mode: "insensitive" as const },
              },
            },
          }
        : {}),
      ...(filters.enterGradeLecturer
        ? {
            enterGradeLecturer: {
              userProfile: {
                fullname: { contains: filters.enterGradeLecturer, mode: "insensitive" as const },
              },
            },
          }
        : {}),
      ...(!canReadAll ? { mainLecturer: { userProfileId: profileId } } : {}),
      deletedAt: null,
      cancelled: false,
      active: true,
      status: "OFFICIAL",
    } satisfies Prisma.SubjectClassWhereInput
  }, [filters, semesterId, trainingObjectTypeId, profileId, canReadAll])

  const { data: dataTable = [], refetch } = useFindManySubjectClass({
    where,
    include: {
      subject: { include: { managementOrganization: true } },
      mainLecturer: {
        include: { userProfile: { select: { fullname: true, code: true } } },
      },
      enterGradeLecturer: {
        include: { userProfile: { select: { fullname: true, code: true } } },
      },
      subjectClassStudent: {
        include: { student: { include: { userProfile: true } } },
      },
    },
    orderBy: { code: "asc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  useEffect(() => {
    formExam.setFieldsValue({ endDate: undefined })
  }, [filters])

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { data: count } = useCountSubjectClass({ where })

  const handleDelete = async (id: string) => {
    try {
      showSpinner()
      await deleteSubjectClass({ where: { id } })
      message.success("Xoá lớp môn học thành công")
      debouncedRefetch()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message
      message.error(msg ? `Xoá thất bại: ${msg}` : "Xoá thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row>
        <Col span={24}>
          <Row align="top" justify="space-between">
            <Col span={12}>
              <Flex>
                <Col span={8}>
                  <Form.Item className="m-0" name="searchText">
                    <Select
                      options={fixedClasses.map((i) => ({
                        value: i.id,
                        label: `${i?.code} - ${i.name}`,
                      }))}
                      id="search"
                      onChange={(e) => handleFilterChange("fixedClassId", e)}
                      placeholder="Chọn lớp quản lý"
                      style={{ height: 32 }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item className="m-0" name="searchText">
                    <Input
                      id="search"
                      onChange={(e) => handleFilterChange("searchText", e.target.value)}
                      placeholder="Tìm kiếm lớp..."
                      style={{ height: 32 }}
                      prefix={<Search size={15} style={{ color: "rgba(0, 0, 0, 0.25)" }} />}
                      className="w-full ml-3"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Flex>
            </Col>
            <Col span={12}>
              <Flex justify="end" align="center" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "SUA") && (
                  <Button
                    type="primary"
                    onClick={() =>
                      onOpen({
                        mode: "create",
                        thesisExpert: false,
                        trainingObjectTypeId,
                        semesterId,
                      })
                    }
                  >
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24} className="mt-4">
          <Table
            filters={filters}
            setFilters={setFilters}
            rowKey="id"
            id="training-category"
            className="table-subject-score"
            columns={[
              {
                title: "STT",
                width: 40,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã lớp",
                dataIndex: "code",
                align: "center",
                width: 120,
                type: "input",
              },
              {
                title: "Môn học",
                width: 175,
                align: "left",
                type: "input",
                render: (_, record) => (
                  <p>
                    {record.type === $Enums.SubjectClassType.RETAKE ? (
                      <Tag color="blue" className="p-0 px-1">
                        Học lại
                      </Tag>
                    ) : record.type === $Enums.SubjectClassType.REEXAM ? (
                      <Tag color="yellow" className="p-0 px-1">
                        Thi lại
                      </Tag>
                    ) : null}
                    {record.subject?.name} ({record.subject?.credit})
                  </p>
                ),
              },
              {
                title: "Thi",
                width: 80,
                align: "center",
                type: "input",
                dataIndex: "examType",
                render: (__, record: { subject?: SubjectVersion }) => {
                  return record?.subject?.examType ? (
                    <div
                    // className={`${record?.subject?.examType === 'OfflineWritten' ? 'text-red-500' : ''}`}
                    >
                      {getExamTypeLabel(record?.subject?.examType)}
                    </div>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Giảng viên 1",
                width: 150,
                align: "center",
                type: "input",
                dataIndex: "mainLecturer",
                render: (_, record) => formatLecturerName(record.mainLecturer),
              },
              {
                title: "Giảng viên NĐ",
                width: 150,
                align: "center",
                type: "input",
                dataIndex: "mainLecturer",
                render: (_, record) => formatLecturerName(record.enterGradeLecturer),
              },
              {
                title: "ĐV phụ trách",
                dataIndex: "danhSachLop",
                width: 100,
                align: "center",
                render: (_, record: any) => (
                  <span>{record.subject?.managementOrganization?.sMa || ""}</span>
                ),
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (!id) return ""
                  return (
                    <Row className="justify-center gap-2">
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "SUA") && (
                        <EditIcon
                          onClick={() => onOpen({ id, mode: "edit", thesisExpert: false })}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                      )}
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC, "XOA") && (
                        <DeleteIcon popConfirm={{ onConfirm: () => handleDelete(id) }} />
                      )}
                    </Row>
                  )
                },
              },
            ]}
            data={dataTable}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>

      <PutSubjectClassModal />
    </div>
  )
}

ClassSubject.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
