import { Button, Col, Flex, Row, Tag, Tabs, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { getWarningLevelColor } from "@hooks/getWarningLevelColor"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import { emptyObjectIf } from "@workspace/constant"
import {
  type AcademicWarning,
  type FixedClass,
  type Prisma,
  type TrainingCourse,
} from "@workspace/db/client"
import {
  useFindManyAcademicWarning,
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useUpdateAcademicWarning,
  useUpdateManyStudentSemesterResult,
  useUpdateStudent,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import GiamCanhCaoHocTap from "./giam-canh-cao-hoc-tap"
import NangCanhCaoHocTap from "./nang-canh-cao-hoc-tap"

dayjs.locale("vi")

interface XetCanhCaoHocTapProps {
  semesterId: string
  trainingObjectTypeId: string
}

const XetCanhCaoHocTap = ({ semesterId, trainingObjectTypeId }: XetCanhCaoHocTapProps) => {
  const [activeTab, setActiveTab] = useState("1")
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    fixedClass: undefined,
    trainingCourse: undefined,
    organization: undefined,
  })

  const isFiltering = useMemo(() => {
    return Object.values(filters).some((value) => !!value)
  }, [filters])

  const where: Prisma.AcademicWarningWhereInput = useMemo(
    () =>
      isFiltering
        ? {
            student: {
              ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" } } : {}),
              userProfile: filters.name
                ? { fullname: { contains: filters.name, mode: "insensitive" } }
                : {},
              ...emptyObjectIf(
                {
                  fixedClassId: {
                    in: Array.isArray(filters.fixedClass)
                      ? filters.fixedClass
                      : filters.fixedClass
                        ? [filters.fixedClass]
                        : undefined,
                  },
                },
                !!filters.fixedClass
              ),
              fixedClass: {
                ...(filters.trainingCourse
                  ? { trainingCourseId: { in: filters.trainingCourse } }
                  : {}),
                ...(filters.organization
                  ? { managementOrganizationId: { in: filters.organization } }
                  : {}),
              },
            },
          }
        : {},
    [filters, isFiltering]
  )

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateAcademicWarning } = useUpdateAcademicWarning()
  const { mutateAsync: updateStudent } = useUpdateStudent()
  const { mutateAsync: updateManyStudentSemesterResult } = useUpdateManyStudentSemesterResult()

  const { data: academicWarningData } = useFindManyAcademicWarning({
    where: {
      semesterId,
      AND: [
        {
          student: {
            fixedClass: {
              trainingCourse: { trainingObjectTypeId },
            },
          },
        },
        where,
      ],
    },
    include: {
      student: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: true,
              managementOrganization: true,
            },
          },
          userProfile: true,
        },
      },
    },
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: { semesterStart: { startDate: "desc" } },
    where: { trainingObjectTypeId, active: true, deletedAt: null },
  })

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    where: { trainingCourse: { trainingObjectTypeId } },
    orderBy: { name: "asc" },
  })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const treeData = buildOrgTree(manageOrgData)

  const { onOpen } = useDisclosure<{ id: string; semesterId: string }>({
    tag: "PutAcademicWarning",
  })

  async function handleDeleteAcademicWarning(record: {
    id: string
    studentId: string
    semesterId: string
    level: number
    increasedFrom?: number | null
    decreasedFrom?: number | null
    student?: { academicWarningLevel?: number } | null
  }) {
    try {
      showSpinner()
      const {
        id,
        studentId,
        semesterId: warningSemesterId,
        level,
        increasedFrom,
        decreasedFrom,
        student,
      } = record
      const delta =
        increasedFrom != null
          ? level - increasedFrom
          : decreasedFrom != null
            ? level - decreasedFrom
            : level
      const restoredStudentLevel = Math.max(0, (student?.academicWarningLevel ?? 0) - delta)
      const restoredSemesterLevel = increasedFrom ?? decreasedFrom ?? 0

      await updateAcademicWarning({
        where: { id },
        data: { deletedAt: new Date() },
      })
      await updateStudent({
        where: { id: studentId },
        data: { academicWarningLevel: restoredStudentLevel },
      })
      await updateManyStudentSemesterResult({
        where: { studentId, semesterId: warningSemesterId },
        data: { academicWarningLevel: restoredSemesterLevel },
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <Row gutter={[16, 0]} className="flex gap-4">
          <Col span={24}>
            <Flex justify="end">
              <Button type="primary" onClick={() => onOpen({ id: "", semesterId })}>
                <BookPlus />
                Thêm học viên
              </Button>
            </Flex>
          </Col>
          <Col span={24}>
            <Table
              rowKey="key"
              data={academicWarningData}
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPage(1)
              }}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Mã sinh viên",
                  dataIndex: "code",
                  width: 120,
                  fixed: "left",
                  type: "input",
                  render: (__, record) => record?.student?.userProfile?.code,
                },
                {
                  title: "Tên sinh viên",
                  dataIndex: "name",
                  width: 200,
                  fixed: "left",
                  type: "input",
                  render: (__, record) => record?.student?.userProfile?.fullname,
                },
                {
                  title: "Ngày sinh",
                  width: 120,
                  align: "center",
                  render: (__, record) => {
                    const date = record?.student?.userProfile?.dateOfBirth
                    return date ? dayjs(date).format("DD/MM/YYYY") : ""
                  },
                },
                {
                  title: "Lớp niên chế",
                  dataIndex: "fixedClass",
                  width: 160,
                  align: "center",
                  type: "select",
                  options: fixedClassData.map((i: FixedClass) => ({
                    value: i.id,
                    label: i.name,
                  })),
                  render: (__, record) => record?.student?.fixedClass?.name,
                },
                {
                  title: "Khoá",
                  dataIndex: "trainingCourse",
                  width: 100,
                  align: "center",
                  type: "select",
                  options: trainingCourseData.map((i: TrainingCourse) => ({
                    value: i.id,
                    label: i.name,
                  })),
                  render: (__, record) => record?.student?.fixedClass?.trainingCourse?.name,
                },
                {
                  title: "Đơn vị quản lý",
                  dataIndex: "organization",
                  width: 150,
                  align: "center",
                  type: "tree_select",
                  options: treeData,
                  render: (__, record) => record?.student?.fixedClass?.managementOrganization?.sTen,
                },
                {
                  title: "Mức CCHT",
                  dataIndex: "level",
                  width: 100,
                  align: "center",
                  fixed: "right",
                  render: (value: number) => <Tag color={getWarningLevelColor(value)}>{value}</Tag>,
                },
                {
                  title: "Thay đổi từ mức",
                  width: 160,
                  align: "center",
                  fixed: "right",
                  render: (_, record) => {
                    const isRaise = record.increasedFrom != null
                    const fromLevel = record.increasedFrom ?? record.decreasedFrom
                    if (fromLevel == null) return null
                    return (
                      <Flex justify="center" align="center" gap={4}>
                        <Tag color={getWarningLevelColor(fromLevel)}>{fromLevel}</Tag>
                        <span className={isRaise ? "text-red-500" : "text-green-600"}>
                          {isRaise ? "↑ Nâng" : "↓ Giảm"}
                        </span>
                      </Flex>
                    )
                  },
                },
                {
                  title: "Ghi chú lý do",
                  dataIndex: "description",
                  width: 150,
                  align: "center",
                  fixed: "right",
                  render: (_, record) => (
                    <span className="line-clamp-2">{record?.description}</span>
                  ),
                },
                {
                  title: "Thao tác",
                  width: 100,
                  align: "center",
                  fixed: "right",
                  render: (_, record) =>
                    record?.id ? (
                      <Row className="justify-center gap-2">
                        <EditIcon
                          onClick={() => onOpen({ id: record?.id, semesterId })}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: () => handleDeleteAcademicWarning(record as AcademicWarning),
                          }}
                        />
                      </Row>
                    ) : null,
                },
              ]}
              pagination={{
                current: currentPage,
                pageSize: numberOfPages,
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
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: "Nâng mức cảnh báo",
              children: (
                <NangCanhCaoHocTap
                  semesterId={semesterId}
                  trainingObjectTypeId={trainingObjectTypeId}
                />
              ),
            },
            {
              key: "2",
              label: "Giảm mức cảnh báo",
              children: (
                <GiamCanhCaoHocTap
                  semesterId={semesterId}
                  trainingObjectTypeId={trainingObjectTypeId}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default XetCanhCaoHocTap
