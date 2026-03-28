import { Button, Checkbox, Col, Flex, Modal, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { DownloadOutlined } from "@ant-design/icons/lib/icons"
import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
// import { $Enums, type StudentSemesterResult } from '@workspace/db'
import type { ScholarshipAward } from "@workspace/db/client"
import {
  useCountTrainingCourse,
  useDeleteScholarshipAward,
  useFindManyScholarship,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import {
  exportStudentScholarshipExcel,
  useExportStudentScholarshipJson,
} from "@workspace/libs/api/training"
import { saveAs } from "file-saver"
import { BookPlus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")

interface XetHocBongProps {
  semesterId: string
  trainingObjectTypeId: string
}

interface SelectedStudent {
  id: string
  code: string
  fullname: string
  scholarshipId: string
  scholarshipName: string
  amount: number
  gpaAtAward: number
  priorityRank: number
  isSelected: boolean
}

const XetHocBong = ({ semesterId, trainingObjectTypeId }: XetHocBongProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { showSpinner, hideSpinner } = useSpinner()

  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
  const [transferDataDisabled, setTransferDataDisabled] = useState(true)
  const [rightPanelData, setRightPanelData] = useState<any[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    scholarship: undefined,
  })

  const where = useMemo(
    () => ({
      scholarships: {
        some: {
          awards: {
            some: {
              semesterId,
              student: {
                ...(filters.code && filters.code !== ""
                  ? {
                      code: {
                        contains: filters.code,
                        mode: "insensitive" as const,
                      },
                    }
                  : {}),
                userProfile:
                  filters.name && filters.name !== ""
                    ? {
                        fullname: {
                          contains: filters.name,
                          mode: "insensitive" as const,
                        },
                      }
                    : {},
              },
              ...(filters.scholarship
                ? {
                    scholarshipId: { in: filters.scholarship },
                  }
                : {}),
            },
          },
        },
      },
    }),
    [semesterId, filters.name, filters.code, filters.scholarship]
  )

  const [isModalVisible, setIsModalVisible] = useState(false)
  const { onOpen, onClose } = useDisclosure<{
    id: string
    semesterId: string
  }>({
    tag: "PutScholarshipAward",
  })

  const {
    data: students = [],
    refetch,
    isPending,
  } = useExportStudentScholarshipJson<any[] | { data: any[] }>(
    {
      semesterId: semesterId || "",
      trainingObjectTypeId,
    },
    {
      query: {
        enabled: !!semesterId && !!trainingObjectTypeId,
      },
    },
    queryClient
  )

  const { data: studentDataAward, refetch: refetchAward } = useFindManyTrainingCourse({
    where,
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    include: {
      scholarships: {
        include: {
          awards: {
            include: {
              student: {
                include: {
                  userProfile: true,
                  studentSemesterResult: {
                    where: { semesterId },
                    take: 1,
                  },
                  fixedClass: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                },
              },
              scholarship: true,
            },
            orderBy: {
              gpaAtAward: "desc",
            },
            where: {
              student: {
                ...(filters.code && filters.code !== ""
                  ? {
                      code: { contains: filters.code, mode: "insensitive" },
                    }
                  : {}),
                userProfile:
                  filters.name && filters.name !== ""
                    ? {
                        fullname: {
                          contains: filters.name,
                          mode: "insensitive",
                        },
                      }
                    : {},
              },
              ...(filters.scholarship
                ? {
                    scholarshipId: { in: filters.scholarship },
                  }
                : {}),
            },
          },
        },
        orderBy: {
          rankOrder: "asc",
        },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: dataScholarship = [] } = useFindManyScholarship({
    where: {
      awards: {
        some: {
          semesterId,
        },
      },
    },
    include: {
      trainingCourse: {
        select: {
          id: true,
          name: true,
        },
      },
      awards: true,
    },
    orderBy: {
      rankOrder: "asc",
    },
  })

  const studentData = useMemo(() => {
    if (!students) return []
    if (Array.isArray(students)) return students
    if (students.data && Array.isArray(students.data)) return students.data
    return []
  }, [students])
  const transformedTrainingCourses = useMemo(() => {
    if (!studentDataAward || !Array.isArray(studentDataAward)) return []

    return studentDataAward.map((course) => {
      const transformedScholarships = (course.scholarships || []).map((scholarship: any) => {
        // Tách phần awards ra ngoài
        const { awards, ...restScholarship } = scholarship
        return restScholarship
      })

      const allAwards = (course.scholarships || []).flatMap((scholarship: any) =>
        (scholarship.awards || []).map((award: ScholarshipAward) => ({
          ...award,
          // Gắn thông tin scholarship vào mỗi award
          scholarshipId: scholarship.id,
          scholarshipName: scholarship.name,
          scholarshipRankOrder: scholarship.rankOrder,
          amount: award.amount.toString(),
        }))
      )

      return {
        ...course,
        scholarships: transformedScholarships,
        awards: allAwards,
      }
    })
  }, [studentDataAward])

  const { data: count } = useCountTrainingCourse({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  useEffect(() => {
    if (studentData.length > 0) {
      const newSelectedStudents: SelectedStudent[] = []

      studentData.forEach((course: any) => {
        if (course.students && Array.isArray(course.students)) {
          course.students.forEach((student: any) => {
            if (student.scholarship && Array.isArray(student.scholarship)) {
              const highestOrderScholarship = student.scholarship.reduce(
                (prev: any, current: any) => (prev.order < current.order ? current : prev)
              )

              if (highestOrderScholarship) {
                newSelectedStudents.push({
                  id: student.id,
                  code: student.code,
                  fullname: student.userProfile.fullname,
                  scholarshipId: highestOrderScholarship.id,
                  scholarshipName: highestOrderScholarship.name,
                  amount:
                    Number(highestOrderScholarship.baseAmount) *
                      highestOrderScholarship.multiplier || 0,
                  gpaAtAward: student.studentSemesterResult.gpaBase4 || 0,
                  priorityRank: highestOrderScholarship.order || 0,
                  isSelected: false,
                })
              }
            }
          })
        }
      })

      setSelectedStudents(newSelectedStudents)
    }
  }, [studentData])

  const onSelectChange = (studentId: string, checked: boolean) => {
    const newSelectedRowKeys = [...selectedRowKeys]
    if (checked) {
      if (!newSelectedRowKeys.includes(studentId)) {
        newSelectedRowKeys.push(studentId)
      }
    } else {
      const index = newSelectedRowKeys.indexOf(studentId)
      if (index > -1) {
        newSelectedRowKeys.splice(index, 1)
      }
    }
    setSelectedRowKeys(newSelectedRowKeys)

    setSelectedStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, isSelected: checked } : student
      )
    )
  }

  const handleScholarshipCheckboxChange = (
    studentId: string,
    scholarship: any,
    checked: boolean,
    studentInfo: any
  ) => {
    if (checked) {
      setSelectedStudents((prev) => {
        const filtered = prev.filter((s) => s.id !== studentId)
        return [
          ...filtered,
          {
            id: studentId,
            code: studentInfo.code,
            fullname: studentInfo.userProfile.fullname,
            scholarshipId: scholarship.id,
            scholarshipName: scholarship.name,
            amount: Number(scholarship.baseAmount) * scholarship.multiplier || 0,
            gpaAtAward: studentInfo.studentSemesterResult.gpaBase4 || 0,
            priorityRank: scholarship.order || 0,
            isSelected: prev.find((s) => s.id === studentId)?.isSelected || false,
          },
        ]
      })
    } else {
      setSelectedStudents((prev) =>
        prev.filter((s) => !(s.id === studentId && s.scholarshipId === scholarship.id))
      )
    }
  }

  useEffect(() => {
    const hasSelected = selectedStudents.some((s) => s.isSelected)
    setTransferDataDisabled(!hasSelected)
  }, [selectedStudents])

  const handleTransferData = () => {
    const dataToTransfer = selectedStudents.filter((s) => s.isSelected)
    setRightPanelData(dataToTransfer)
    setIsModalVisible(true)
  }

  const handleSaveScholarshipAward = async () => {
    if (!semesterId) {
      message.error("Vui lòng chọn học kỳ")
      return
    }

    if (rightPanelData.length === 0) {
      message.error("Không có dữ liệu để lưu")
      return
    }

    try {
      const awardsToAdd = rightPanelData.map((student) => ({
        studentId: student.id,
        scholarshipId: student.scholarshipId,
        semesterId: semesterId,
        amount: student.amount,
        gpaAtAward: student.gpaAtAward ? Number(student.gpaAtAward) : null,
        priorityRank: student.priorityRank,
      }))

      const queries = awardsToAdd.map((award) => ({
        model: "ScholarshipAward" as const,
        operation: "upsert" as const,
        data: {
          where: {
            studentId_scholarshipId_semesterId: {
              studentId: award.studentId,
              scholarshipId: award.scholarshipId,
              semesterId: award.semesterId,
            },
          },
          create: award,
          update: award,
        },
      }))

      await sqlTransaction(queries)

      message.success("Lưu học bổng thành công")
      setSelectedStudents([])
      setRightPanelData([])
      setSelectedRowKeys([])
      setIsModalVisible(false)
      refetch()
      refetchAward()
    } catch (error) {
      console.error("Lỗi khi lưu học bổng:", error)
      message.error("Có lỗi xảy ra khi lưu học bổng")
    }
  }

  const rowSelection = {
    selectedRowKeys,
    hideSelectAll: true,
    columnWidth: 48,
    renderCell: (_: any, record: any) =>
      record.id ? <Checkbox checked={selectedRowKeys.includes(record.id)} /> : null,
  }

  const { mutateAsync: deleteScholarshipAward } = useDeleteScholarshipAward()
  async function handleDeleteScholarshipAward(id: string) {
    try {
      showSpinner()
      await deleteScholarshipAward({
        where: {
          id,
        },
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

  const handleExportExcel = async () => {
    try {
      showSpinner()
      const res = await exportStudentScholarshipExcel({
        semesterId,
        trainingObjectTypeId,
      })

      if (res.status === 200) {
        saveAs(res.data, "Danh_sach_hoc_bong.xlsx")
        message.success("Xuất Excel thành công")
      } else {
        message.error("Đã xảy ra lỗi khi xuất Excel")
      }
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error)
      message.error("Đã xảy ra lỗi khi xuất Excel")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[16, 0]} className="mt-4">
      <Col span={24} className="!p-0">
        <Flex vertical gap={16}>
          <Col span={24}>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                      <Flex justify="space-between">
                        <div className="text-xl font-bold">Danh sách sinh viên nhận học bổng</div>
                        <Button
                          type="primary"
                          onClick={() =>
                            onOpen({
                              id: "",
                              semesterId,
                            })
                          }
                        >
                          <BookPlus />
                          Thêm học viên
                        </Button>
                      </Flex>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <TableCollapse
                    rowKey="id"
                    headerTitleKey="name"
                    childrenFieldName="awards"
                    filters={filters}
                    setFilters={(value) => {
                      setFilters(value)
                      setCurrentPage(1)
                    }}
                    defaultExpandAll
                    columns={[
                      {
                        title: "Mã sinh viên",
                        dataIndex: "code",
                        width: 120,
                        align: "center",
                        type: "input",
                        render: (__, record) => record?.student?.code,
                      },
                      {
                        title: "Tên sinh viên",
                        dataIndex: "name",
                        width: 150,
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
                      // {
                      //     title: 'GPA',
                      //     dataIndex: ['gpaAtAward'],
                      //     width: 120,
                      //     align: 'center',
                      // },
                      {
                        title: "Điểm hệ 4",
                        width: 80,
                        align: "center",
                        render: (_, record) =>
                          record?.student?.studentSemesterResult?.[0]?.gpaBase4
                            ? Number(record.student.studentSemesterResult[0].gpaBase4).toFixed(2)
                            : "-",
                      },
                      {
                        title: "Điểm hệ 10",
                        width: 80,
                        align: "center",
                        render: (_, record) =>
                          record?.student?.studentSemesterResult?.[0]?.gpaBase10
                            ? Number(record.student.studentSemesterResult[0].gpaBase10).toFixed(2)
                            : "-",
                      },
                      {
                        title: "Điểm rèn luyện",
                        width: 120,
                        align: "center",
                        render: (_, record) =>
                          record?.student?.studentSemesterResult?.[0]?.conductScore ?? "-",
                      },
                      {
                        title: "Số tiền học bổng",
                        dataIndex: ["amount"],
                        width: 150,
                        render: (__, record) =>
                          record?.amount ? `${Number(record?.amount).formatVND()}` : "-",
                      },
                      {
                        title: "Học bổng",
                        dataIndex: "scholarship",
                        width: 200,
                        type: "select",
                        options: dataScholarship.map((i: any) => ({
                          value: i.id,
                          label: [i.name, i.rankOrder, i.trainingCourse.name]
                            .filter(Boolean)
                            .join(" - "),
                        })),
                        render: (__, record) => record?.scholarship?.name,
                      },
                      {
                        title: "Thao tác",
                        width: 100,
                        align: "center",
                        fixed: "right",
                        render: (_, record) => {
                          if (record?.id) {
                            return (
                              <Row className="justify-center gap-2">
                                <EditIcon
                                  onClick={() =>
                                    onOpen({
                                      id: record?.id,
                                      semesterId,
                                    })
                                  }
                                  className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                  popConfirm={{
                                    onConfirm: () => handleDeleteScholarshipAward(record?.id),
                                  }}
                                />
                              </Row>
                            )
                          }
                          return ""
                        },
                      },
                    ]}
                    data={transformedTrainingCourses}
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
                    }}
                  />
                </Col>
              </Row>
            </div>
          </Col>
          <Col span={24}>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                      <Flex justify="space-between">
                        <div className="text-xl font-bold">
                          Danh sách sinh viên thoả mãn học bổng
                        </div>
                        <Flex gap={8}>
                          <Button
                            type="primary"
                            className="h-[32px] px-4"
                            onClick={handleExportExcel}
                          >
                            <DownloadOutlined />
                            Xuất Excel
                          </Button>
                          <Button
                            type="primary"
                            className="h-[32px] px-4"
                            onClick={handleTransferData}
                            disabled={transferDataDisabled}
                          >
                            <BookPlus />
                            Chuyển dữ liệu
                          </Button>
                        </Flex>
                      </Flex>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <TableCollapse
                    rowKey="courseId"
                    headerTitleKey="courseName"
                    childrenFieldName="students"
                    defaultExpandAll
                    rowSelection={rowSelection}
                    onRow={(record) => ({
                      onClick: () => {
                        if (!record.id) return
                        const selected = selectedRowKeys.includes(record.id)
                        onSelectChange(record.id, !selected)
                      },
                    })}
                    columns={[
                      {
                        title: "Mã sinh viên",
                        dataIndex: ["code"],
                        width: 120,
                        align: "center",
                      },
                      {
                        title: "Tên sinh viên",
                        dataIndex: ["userProfile", "fullname"],
                        width: 150,
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
                        title: "Điểm hệ 4",
                        width: 80,
                        align: "center",
                        render: (_, record) =>
                          record?.studentSemesterResult?.gpaBase4
                            ? Number(record.studentSemesterResult.gpaBase4).toFixed(2)
                            : "-",
                      },
                      {
                        title: "Điểm hệ 10",
                        width: 80,
                        align: "center",
                        render: (_, record) =>
                          record?.studentSemesterResult?.gpaBase10
                            ? Number(record.studentSemesterResult.gpaBase10).toFixed(2)
                            : "-",
                      },
                      {
                        title: "Điểm rèn luyện",
                        width: 120,
                        align: "center",
                        render: (_, record) => record?.studentSemesterResult?.conductScore ?? "-",
                      },
                      // {
                      //     title: 'TBHK',
                      //     dataIndex: ['studentSemesterResult'],
                      //     width: 40,
                      //     align: 'center',
                      //     render: (result?: StudentSemesterResult) =>
                      //         result?.baseScore ===
                      //         $Enums.AcademicRankingBaseType.Base10
                      //             ? Number(result.gpaBase10)
                      //             : Number(result?.gpaBase4 || 0),
                      // },
                      // {
                      //     title: 'Xếp loại rèn luyện',
                      //     dataIndex: [
                      //         'studentSemesterResult',
                      //         'studentTrainingType',
                      //     ],
                      //     width: 120,
                      //     align: 'center',
                      //     render: (value) => (
                      //         <Tag color={getStudentTrainingTypeColor(value)}>
                      //             {getStudentTrainingTypeLabel(value)}
                      //         </Tag>
                      //     ),
                      // },
                      {
                        title: "Học bổng",
                        dataIndex: ["scholarship"],
                        width: 200,
                        fixed: "right",
                        render: (scholarships, record) => (
                          <div className="flex flex-col gap-2">
                            {Array.isArray(scholarships) &&
                              scholarships.map((scholarship) => {
                                const isChecked = selectedStudents.some(
                                  (s) => s.id === record.id && s.scholarshipId === scholarship.id
                                )
                                return (
                                  <div key={scholarship.id} className="flex items-center">
                                    <Checkbox
                                      className="mr-2"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        handleScholarshipCheckboxChange(
                                          record.id,
                                          scholarship,
                                          e.target.checked,
                                          record
                                        )
                                      }
                                    />
                                    <span className="text-gray-800">{scholarship.name}</span>
                                  </div>
                                )
                              })}
                          </div>
                        ),
                      },

                      {
                        title: "Lý do",
                        dataIndex: ["reason"],
                        width: 200,
                        align: "center",
                        render: (value?: string) => value?.split("\n").map((r) => <p>{r}</p>),
                      },
                    ]}
                    data={studentData}
                    pagination={{
                      current: currentPage,
                      pageSize: numberOfPages,
                      total: studentData.reduce(
                        (acc, course) => acc + (course.students?.length || 0),
                        0
                      ),
                      onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) {
                          setCurrentPage(page)
                        } else {
                          setCurrentPage(1)
                          setNumberOfPages(pageSize)
                        }
                      },
                    }}
                  />
                </Col>
              </Row>
            </div>
          </Col>
        </Flex>
      </Col>
      {!!isModalVisible && (
        <Modal
          title="Danh sách sinh viên được chọn"
          open={isModalVisible}
          onOk={handleSaveScholarshipAward}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          footer={[
            <Button key="back" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleSaveScholarshipAward}
              disabled={rightPanelData.length === 0}
            >
              Lưu
            </Button>,
          ]}
        >
          {rightPanelData.length > 0 ? (
            <Table
              rowKey="id"
              data={rightPanelData}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                },
                {
                  title: "Mã sinh viên",
                  dataIndex: "code",
                  width: 120,
                  align: "center",
                  fixed: "left",
                },
                {
                  title: "Tên sinh viên",
                  dataIndex: "fullname",
                  width: 200,
                  fixed: "left",
                },
                {
                  title: "Trung bình hệ 4",
                  dataIndex: "gpaAtAward",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Xếp hạng",
                  dataIndex: "priorityRank",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Học bổng",
                  dataIndex: "scholarshipName",
                  width: 150,
                  align: "center",
                  fixed: "right",
                },
              ]}
              pagination={false}
            />
          ) : (
            <div className="text-gray-400 text-center py-8">Chưa có dữ liệu được chọn</div>
          )}
        </Modal>
      )}
    </Row>
  )
}

export default XetHocBong
