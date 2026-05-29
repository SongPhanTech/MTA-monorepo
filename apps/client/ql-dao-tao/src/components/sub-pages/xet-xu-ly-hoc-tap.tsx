import DeleteIcon from "@components/icons/delete"
import {
  Button,
  Checkbox,
  Col,
  Flex,
  message,
  Row,
  type TableProps,
  Popconfirm,
  Tag,
  Tooltip,
} from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useDecisionStatusOptions } from "@hooks/decisionStatus"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type AcademicActionType,
  DecisionStatus,
  type Prisma,
  type StudentSemesterResult,
} from "@workspace/db/client"
import {
  useCountStudentAcademicDecision,
  useDeleteStudentAcademicDecision,
  useFindManyStudentAcademicDecision,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useExportStudentAcademicActionJson } from "@workspace/libs/api/training"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")

interface XetXuLyHocTapProps {
  semesterId: string
  trainingObjectTypeId: string
  actionTaken: AcademicActionType
}

interface SelectedStudent {
  id: string
  code: string
  fullname: string
  academicActionId: string
  academicActionName: string
  isSelected: boolean
  reason?: string
}

const XetXuLyHocTap = ({ semesterId, trainingObjectTypeId, actionTaken }: XetXuLyHocTapProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  // Pagination riêng cho bảng "Quyết định" phía trên
  const [currentPageDecision, setCurrentPageDecision] = useState(1)
  const [numberOfPagesDecision, setNumberOfPagesDecision] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedDecision, setSelectedDecision] = useState<React.Key[]>([])
  const {
    options: decisionStatusOption,
    getDecisionStatusLabel,
    getDecisionStatusColor,
  } = useDecisionStatusOptions()
  const { showSpinner, hideSpinner } = useSpinner()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    fixedClass: undefined,
    trainingCourse: undefined,
    organization: undefined,
    status: undefined,
    decisionDate: undefined,
  })
  // Bộ lọc riêng cho bảng "Xét" (danh sách sinh viên được xét) phía dưới
  const [studentFilters, setStudentFilters] = useState<FilterProps>({
    name: "",
    fixedClass: undefined,
  })
  const isFiltering = useMemo(() => {
    return Object.values(filters).some((value) => !!value)
  }, [filters])

  const where: Prisma.StudentAcademicDecisionWhereInput = useMemo(
    () =>
      isFiltering
        ? {
            student: {
              ...(filters.code
                ? {
                    code: {
                      contains: filters.code,
                      mode: "insensitive",
                    },
                  }
                : {}),
              userProfile: filters.name
                ? {
                    fullname: {
                      contains: filters.name,
                      mode: "insensitive",
                    },
                  }
                : {},
              ...(filters.fixedClass
                ? {
                    fixedClassId: {
                      in: Array.isArray(filters.fixedClass)
                        ? filters.fixedClass
                        : [filters.fixedClass],
                    },
                  }
                : {}),
              fixedClass: {
                ...(filters.trainingCourse
                  ? {
                      trainingCourseId: {
                        in: Array.isArray(filters.trainingCourse)
                          ? filters.trainingCourse
                          : [filters.trainingCourse],
                      },
                    }
                  : {}),
                ...(filters.organization
                  ? {
                      managementOrganizationId: {
                        in: Array.isArray(filters.organization)
                          ? filters.organization
                          : [filters.organization],
                      },
                    }
                  : {}),
                ...(trainingObjectTypeId ? { trainingCourse: { trainingObjectTypeId } } : {}),
              },
            },
            ...(filters.status ? { status: { in: filters.status } } : {}),
            ...(filters.decisionDate?.length === 2
              ? {
                  decisionDate: {
                    gte: dayjs(filters.decisionDate?.[0], "DD/MM/YYYY").toDate(),
                    lte: dayjs(filters.decisionDate?.[1], "DD/MM/YYYY").toDate(),
                  },
                }
              : {}),
          }
        : {},
    [filters, isFiltering]
  )
  const { data } = useFindManyStudentAcademicDecision(
    {
      where: {
        semesterId,
        actionTaken,
        ...(trainingObjectTypeId
          ? { student: { fixedClass: { trainingCourse: { trainingObjectTypeId } } } }
          : {}),
        ...where,
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
        appliedConfig: true,
      },
      take: numberOfPagesDecision,
      skip: (currentPageDecision - 1) * numberOfPagesDecision,
    },
    { enabled: !!semesterId }
  )

  const { data: count } = useCountStudentAcademicDecision({
    where: {
      semesterId,
      actionTaken,
      ...(trainingObjectTypeId
        ? { student: { fixedClass: { trainingCourse: { trainingObjectTypeId } } } }
        : {}),
      ...where,
    },
  })

  const { mutateAsync: deleteStudentAcademicDecision } = useDeleteStudentAcademicDecision()
  async function handleDeleteStudentAcademicDecision(id: string) {
    try {
      showSpinner()
      await deleteStudentAcademicDecision({
        where: { id },
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

  const { onOpen } = useDisclosure<{
    id: string
    semesterId: string
    actionTaken: AcademicActionType
  }>({
    tag: "PutStudentAcademicDecision",
  })

  const { onOpen: openModalChuyenLopLuuBan } = useDisclosure<{
    ids: string[]
    actionTaken: AcademicActionType
  }>({
    tag: "ModalChuyenLopLuuBan",
  })

  const { data: students = [], isFetching: isLoadingStudents } = useExportStudentAcademicActionJson<
    any[] | { data: any[] }
  >(
    {
      semesterId: semesterId,
      trainingObjectTypeId,
      academicActionType: actionTaken,
    },
    {
      query: {
        enabled: !!semesterId && !!trainingObjectTypeId,
      },
    },
    queryClient
  )

  const studentData = useMemo(() => {
    if (!students) return []
    if (Array.isArray(students)) return students
    if (students.data && Array.isArray(students.data)) return students.data
    return []
  }, [students])

  const classOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of studentData)
      for (const s of group.students ?? [])
        if (s?.fixedClass?.code) map.set(s.fixedClass.code, s.fixedClass.name ?? s.fixedClass.code)
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [studentData])

  const filteredStudentData = useMemo(() => {
    const studentIdsWithDecisions = data
      ? new Set(data.map((decision: any) => decision.studentId))
      : new Set()
    const kw = normalizeVietnamese((studentFilters.name ?? "").trim())
    const cls = Array.isArray(studentFilters.fixedClass)
      ? studentFilters.fixedClass
      : studentFilters.fixedClass
        ? [studentFilters.fixedClass]
        : []

    return studentData.map((record) => ({
      ...record,
      students: (record.students || []).filter(
        (student: any) =>
          !studentIdsWithDecisions.has(student.id) &&
          !!student.studentSemesterResult && // Chỉ lấy những sinh viên có kết quả học tập trong học kỳ này
          (!kw || normalizeVietnamese(student?.userProfile?.fullname ?? "").includes(kw)) &&
          (cls.length === 0 || cls.includes(student?.fixedClass?.code))
      ),
    }))
  }, [studentData, data, studentFilters])

  const { pagedStudentData, totalStudentsCount } = useMemo(() => {
    const allStudents = filteredStudentData.flatMap((group) =>
      (group.students || []).map((student: any) => ({
        ...student,
        _parent: group,
      }))
    )

    const total = allStudents.length
    const start = (currentPage - 1) * numberOfPages
    const end = start + numberOfPages
    const slicedStudents = allStudents.slice(start, end)

    const groupsMap = new Map<string, any>()
    for (const student of slicedStudents) {
      const parent = student._parent
      if (!groupsMap.has(parent.courseId)) {
        groupsMap.set(parent.courseId, { ...parent, students: [] })
      }
      groupsMap.get(parent.courseId).students.push(student)
    }

    return {
      pagedStudentData: Array.from(groupsMap.values()),
      totalStudentsCount: total,
    }
  }, [filteredStudentData, currentPage, numberOfPages])

  const updateSelectedStudents = useMemo(() => {
    return (keys: React.Key[]) => {
      const selected = keys
        .map((id) => {
          let studentInfo = null
          for (const course of studentData) {
            const found = course.students?.find((s: any) => s.id === id)
            if (found) {
              studentInfo = found
              break
            }
          }

          if (studentInfo) {
            return {
              id: studentInfo.id,
              code: studentInfo.code,
              fullname: studentInfo.userProfile?.fullname,
              academicActionId: studentInfo.academicAction?.[0]?.id,
              academicActionName: studentInfo.academicAction?.[0]?.name,
              isSelected: true,
              academicActions: studentInfo.academicAction || [],
              reason: studentInfo.reason,
            }
          }
          return null
        })
        .filter(Boolean) as SelectedStudent[]

      setSelectedStudents(selected)
      return selected
    }
  }, [studentData])

  const decisionSelection: TableProps["rowSelection"] = {
    selectedRowKeys: selectedDecision,
    onChange: (selectedRowKeys: React.Key[], selectedRows) => {
      setSelectedDecision(selectedRowKeys)
    },
    getCheckboxProps: (record) => ({
      disabled: record?.updatedResult,
    }),
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
      updateSelectedStudents(newSelectedRowKeys)
    },
    getCheckboxProps: (record: any) => {
      const isHeaderRow = Array.isArray(record.students)
      return {
        style: isHeaderRow ? { display: "none" } : {},
      }
    },
  }

  const handleApprove = async () => {
    if (!semesterId) {
      message.error("Vui lòng chọn học kỳ")
      return
    }

    if (selectedStudents.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên để duyệt")
      return
    }

    try {
      const queries = selectedStudents.map((student) => ({
        model: "StudentAcademicDecision" as const,
        operation: "create" as const,
        data: {
          data: {
            studentId: student.id,
            semesterId: semesterId,
            actionTaken: actionTaken,
            status: DecisionStatus.PENDING,
            appliedConfigId: student.academicActionId || undefined,
            decisionDate: new Date(),
            reason: student.reason || undefined,
          },
        },
      }))

      await sqlTransaction(queries)

      queryClient.invalidateQueries({
        queryKey: ["zenstack", "StudentAcademicDecision"],
      })
      queryClient.invalidateQueries({
        queryKey: ["/api/student/export-json-list-student-academic-action"],
      })

      message.success(`Đã duyệt thành công cho ${selectedStudents.length} sinh viên`)
      setSelectedStudents([])
      setSelectedRowKeys([])
    } catch (error) {
      console.error("Lỗi khi duyệt quyết định:", error)
      message.error("Có lỗi xảy ra khi duyệt quyết định")
    }
  }
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <Row gutter={[16, 0]}>
          <Col span={24}>
            <Row gutter={[16, 16]} align="top" justify="space-between">
              <Col span={24}>
                <Row justify={"space-between"}>
                  <h3 className="text-xl font-bold">Quyết định</h3>
                  <Flex justify="end" gap={4}>
                    <Button
                      type="primary"
                      disabled={!selectedDecision.length}
                      onClick={() => {
                        openModalChuyenLopLuuBan({
                          ids: selectedDecision as string[],
                          actionTaken,
                        })
                        setSelectedDecision([])
                      }}
                    >
                      <BookPlus />
                      Cập nhật SV
                    </Button>

                    <Button
                      type="primary"
                      onClick={() =>
                        onOpen({
                          id: "",
                          semesterId,
                          actionTaken,
                        })
                      }
                    >
                      <BookPlus />
                      Thêm học viên
                    </Button>
                  </Flex>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col span={24}>
            <Table
              rowKey="id"
              data={data}
              filters={filters}
              rowSelection={decisionSelection}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPageDecision(1)
              }}
              onRow={(record) => ({
                onClick: () => {
                  if (record?.updatedResult) return
                  const selectedKeys = decisionSelection.selectedRowKeys as React.Key[]
                  const isSelected = selectedKeys.includes(record.id)

                  const newSelectedKeys = isSelected
                    ? selectedKeys.filter((key) => key !== record.id)
                    : [...selectedKeys, record.id]

                  decisionSelection.onChange?.(newSelectedKeys, [], {
                    type: "all",
                  })
                },
              })}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Mã SV",
                  dataIndex: "code",
                  width: 100,
                  align: "center",
                  fixed: "left",
                  // type: 'input',
                  render: (__, record) => record?.student?.code,
                },
                {
                  title: "Tên sinh viên",
                  dataIndex: "name",
                  width: 200,
                  fixed: "left",
                  // type: 'input',
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
                  width: 150,
                  align: "center",
                  render: (__, record) => record?.student?.fixedClass?.name,
                },
                {
                  title: "Khoá",
                  dataIndex: "trainingCourse",
                  width: 100,
                  align: "center",
                  render: (__, record) => record?.student?.fixedClass?.trainingCourse?.name,
                },
                {
                  title: "Đơn vị quản lý",
                  dataIndex: "organization",
                  width: 150,
                  align: "center",
                  render: (__, record) => record?.student?.fixedClass?.managementOrganization?.sTen,
                },
                {
                  title: "Ghi chú lý do",
                  dataIndex: "reason",
                  width: 100,
                  align: "center",
                  fixed: "right",
                  render: (value) => <span className="line-clamp-2">{value}</span>,
                },
                {
                  title: "Ngày quyết định",
                  dataIndex: "decisionDate",
                  width: 150,
                  align: "center",
                  render: (__, record) =>
                    record.decisionDate ? dayjs(record.decisionDate).format("DD/MM/YYYY") : "",
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  width: 120,
                  align: "center",
                  fixed: "right",
                  render: (status) => (
                    <Tag color={getDecisionStatusColor(status)}>
                      {getDecisionStatusLabel(status)}
                    </Tag>
                  ),
                },
                {
                  title: "Thao tác",
                  width: 100,
                  align: "center",
                  fixed: "right",
                  render: (_, record) => {
                    const isDisabled = record?.updatedResult

                    return record?.id ? (
                      <Row className="justify-center gap-2">
                        <Button
                          type="text"
                          className="hover:bg-transparent px-0"
                          disabled={isDisabled}
                        >
                          <EditIcon
                            onClick={() =>
                              onOpen({
                                id: record?.id,
                                semesterId,
                                actionTaken,
                              })
                            }
                            className="text-sm text-blue-700 cursor-pointer bg-transparent border-none"
                          />
                        </Button>
                        <Button
                          type="text"
                          className="hover:bg-transparent px-0"
                          disabled={isDisabled}
                        >
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: () => handleDeleteStudentAcademicDecision(record?.id),
                            }}
                          />
                        </Button>
                      </Row>
                    ) : null
                  },
                },
              ]}
              pagination={{
                current: currentPageDecision,
                pageSize: numberOfPagesDecision,
                total: count,
                onChange: (page, pageSize) => {
                  if (numberOfPagesDecision === pageSize) {
                    setCurrentPageDecision(page)
                  } else {
                    setCurrentPageDecision(1)
                    setNumberOfPagesDecision(pageSize)
                  }
                },
                showTotal: (total, range) =>
                  `${range[0]} - ${range[1]} trong tổng số ${total} sinh viên`,
              }}
            />
          </Col>
        </Row>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <Row gutter={[16, 0]}>
          <Col span={24}>
            <Row gutter={[16, 16]} align="top" justify="space-between">
              <Col span={24}>
                <Row justify={"space-between"}>
                  <h3 className="text-xl font-bold">Xét</h3>
                  <Flex justify="end">
                    <Popconfirm
                      placement="bottomRight"
                      title={"Bạn có chắc muốn xét đình chỉ những học viên này không?"}
                      onConfirm={handleApprove}
                      okText="Đồng ý"
                      cancelText="Hủy"
                    >
                      <Button type="primary" disabled={selectedStudents.length === 0}>
                        <BookPlus />
                        Duyệt
                      </Button>
                    </Popconfirm>
                  </Flex>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col span={24}>
            <TableCollapse
              loading={isLoadingStudents}
              rowKey="courseId"
              headerTitleKey="courseName"
              childrenFieldName="students"
              defaultExpandAll
              rowSelection={rowSelection}
              filters={studentFilters}
              setFilters={(value) => {
                setStudentFilters(value)
                setCurrentPage(1)
              }}
              columns={[
                {
                  title: "Mã SV",
                  dataIndex: ["code"],
                  width: 100,
                  align: "center",
                },
                {
                  title: "Tên sinh viên",
                  dataIndex: "name",
                  type: "input",
                  width: 150,
                  render: (_, record) => record?.userProfile?.fullname ?? "",
                },
                {
                  title: "Ngày sinh",
                  width: 120,
                  align: "center",
                  render: (__, record) => {
                    const date = record?.userProfile?.dateOfBirth
                    return date ? dayjs(date).format("DD/MM/YYYY") : ""
                  },
                },
                {
                  title: "Lớp",
                  dataIndex: "fixedClass",
                  type: "select",
                  options: classOptions,
                  width: 60,
                  align: "center",
                  render: (_, record) => {
                    return (
                      <Tooltip title={record?.fixedClass?.name}>
                        {record?.fixedClass?.code || "-"}
                      </Tooltip>
                    )
                  },
                },
                {
                  title: "Học kỳ",
                  dataIndex: ["studentSemesterResult", "semesterIndexInCourse"],
                  width: 40,
                  align: "center",
                },
                {
                  title: "TBHK",
                  dataIndex: ["studentSemesterResult"],
                  width: 40,
                  align: "center",
                  render: (result?: StudentSemesterResult) =>
                    result?.baseScore === $Enums.AcademicRankingBaseType.Base10
                      ? Number(result.gpaBase10)
                      : Number(result?.gpaBase4 || 0),
                },
                {
                  title: "Nguyên do",
                  dataIndex: "reason",
                  width: 150,
                },
                {
                  title: "Cảnh cáo",
                  dataIndex: "academicAction",
                  width: 200,
                  fixed: "right",
                  render: (academicAction, record) => {
                    const hasAcademicActions =
                      Array.isArray(academicAction) && academicAction.length > 0
                    const firstWarningId = hasAcademicActions ? academicAction[0].id : null

                    return (
                      <div className="flex flex-col gap-2">
                        {hasAcademicActions &&
                          academicAction.map((action) => {
                            const isFirstWarning = action.id === firstWarningId
                            return (
                              <div key={action.id} className="flex items-center">
                                <Checkbox className="mr-2" checked={isFirstWarning} />
                                <span className="text-gray-800">{action.name}</span>
                              </div>
                            )
                          })}
                      </div>
                    )
                  },
                },
              ]}
              data={pagedStudentData}
              pagination={{
                current: currentPage,
                pageSize: numberOfPages,
                total: totalStudentsCount,
                onChange: (page, pageSize) => {
                  if (numberOfPages === pageSize) {
                    setCurrentPage(page)
                  } else {
                    setCurrentPage(1)
                    setNumberOfPages(pageSize)
                  }
                },
                showTotal: (total, range) =>
                  `${range[0]} - ${range[1]} trong tổng số ${total} sinh viên`,
              }}
            />
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default XetXuLyHocTap
