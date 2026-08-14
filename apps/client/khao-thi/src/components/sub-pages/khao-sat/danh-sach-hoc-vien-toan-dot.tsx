import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import ExportStudentToanDot from "@components/modal/export-list-student-toan-dot"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import {
  useFindManyFixedClass,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
  useFindUniqueClusterSurvey,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Col, Flex, Row, Skeleton, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { Eye } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function DanhSachHocVienToanDot({ selectedId }: { selectedId: string }) {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    code: "",
    idCardNumber: "",
    phoneNumber: "",
    statusSurvey: undefined,
    fixedClassIds: undefined,
    trainingCourseIds: undefined,
    organization: undefined,
    dateOfBirth: undefined,
  })
  const { data: fixedClasses = [] } = useFindManyFixedClass({
    orderBy: { name: "asc" },
  })
  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })
  const { data: clusterSurvey } = useFindUniqueClusterSurvey(
    { where: { id: selectedId } },
    { enabled: !!selectedId }
  )

  const where = useMemo(() => {
    return {
      survey: {
        some: {
          clusterSurveyId: selectedId,
        },
      },
    }
  }, [selectedId])

  const { data, isLoading } = useFindManySubjectClass(
    {
      where,
      include: {
        mainLecturer: {
          include: {
            userProfile: true,
          },
        },
        subjectClassStudent: {
          where: {
            student: {
              ...(filters.name
                ? {
                    userProfile: {
                      fullname: {
                        contains: filters.name,
                        mode: "insensitive" as const,
                      },
                    },
                  }
                : {}),
              ...(filters.code && {
                code: {
                  contains: filters.code,
                  mode: "insensitive" as const,
                },
              }),
              ...(filters.idCardNumber && {
                userProfile: {
                  idCardNumber: {
                    contains: filters.idCardNumber,
                    mode: "insensitive" as const,
                  },
                },
              }),
              ...(filters.phoneNumber && {
                userProfile: {
                  idCardNumber: {
                    contains: filters.phoneNumber,
                    mode: "insensitive" as const,
                  },
                },
              }),
              ...(filters.fixedClassIds && {
                fixedClassId: {
                  in: filters.fixedClassIds,
                },
              }),
              ...(filters.trainingCourseIds && {
                fixedClass: {
                  trainingCourseId: {
                    in: filters.trainingCourseIds,
                  },
                },
              }),
              ...(filters.statusSurvey && filters.statusSurvey.length === 1
                ? {
                    userProfile: {
                      surveySession:
                        filters.statusSurvey[0] === true
                          ? {
                              // Trường hợp chọn "Đã làm" [true]
                              some: {
                                survey: {
                                  clusterSurveyId: selectedId,
                                },
                              },
                            }
                          : {
                              // Trường hợp chọn "Chưa làm" [false]
                              none: {
                                survey: {
                                  clusterSurveyId: selectedId,
                                },
                              },
                            },
                    },
                  }
                : {}),
              ...(filters.dateOfBirth?.length === 2
                ? {
                    userProfile: {
                      dateOfBirth: {
                        gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                        lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                      },
                    },
                  }
                : {}),
            },
          },
          include: {
            student: {
              include: {
                userProfile: {
                  include: {
                    surveySession: {
                      where: {
                        survey: {
                          clusterSurveyId: selectedId,
                        },
                      },
                      include: {
                        survey: true,
                      },
                    },
                  },
                },
                fixedClass: {
                  include: {
                    trainingCourse: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!selectedId,
    }
  )

  const checkStatus = (record: any) => {
    if (record?.student?.userProfile?.surveySession?.length > 0) {
      const result = record?.student?.userProfile?.surveySession?.find(
        (item: any) => item?.survey?.subjectClassId === record?.subjectClassId
      )
      if (result) {
        return result
      }
    }
    return null
  }

  useSpinner()

  const { onOpen } = useDisclosure<{ userId: string; surveyId: string; userName?: string }>({
    tag: "ReviewSurveyModal",
  })

  let totalStudents = 0
  let doneStudents = 0

  data?.forEach((subjectClass: any) => {
    const students = subjectClass?.subjectClassStudent || []
    totalStudents += students.length
    students.forEach((studentRecord: any) => {
      if (checkStatus(studentRecord)) {
        doneStudents++
      }
    })
  })

  return (
    <div>
      <Row gutter={[16, 4]}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <Col span={24}>
              <Flex align="center" justify="space-between">
                <div className="text-base font-bold uppercase text-gray-900">
                  Đợt khảo sát: {clusterSurvey?.name || ""}
                </div>

                <ExportStudentToanDot
                  query={where}
                  selectedId={selectedId}
                  clusterName={clusterSurvey?.name}
                />
              </Flex>
            </Col>
            <Col span={24}>
              <TableCollapse
                childrenFieldName="subjectClassStudent"
                rowKey={"id"}
                filters={filters}
                headerTitleKey={({ code, name }) => `${[code, name].filter(Boolean).join(" - ")}`}
                setFilters={(value) => {
                  setFilters(value)
                  setCurrentPage(1)
                }}
                scroll={{ y: "calc(100vh - 225px)", x: "max-content" }}
                className="w-full"
                columns={[
                  {
                    title: "Mã SV",
                    dataIndex: "code",
                    width: 150,
                    type: "input",
                    render: (_, record) => record?.student?.code || "",
                  },
                  {
                    title: "Họ và tên",
                    dataIndex: "name",
                    type: "input",
                    render: (_, record) => {
                      return `${record?.student?.userProfile?.lastName || ""} ${record?.student?.userProfile?.firstName || ""}`
                    },
                  },
                  {
                    title: "Ngày sinh",
                    dataIndex: "dateOfBirth",
                    width: 120,
                    align: "center",
                    type: "date",
                    render: (_, record) => {
                      return record?.student?.userProfile?.dateOfBirth
                        ? dayjs(record?.student?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                        : ""
                    },
                  },
                  {
                    title: "CCCD",
                    dataIndex: "idCardNumber",
                    width: 120,
                    align: "center",
                    type: "input",
                    render: (_, record) => record?.student?.userProfile?.idCardNumber || "",
                  },
                  {
                    title: "SĐT",
                    dataIndex: "phoneNumber",
                    width: 120,
                    align: "center",
                    type: "input",
                    render: (_, record) => record?.student?.userProfile?.phoneNumber || "",
                  },
                  {
                    title: "Lớp quản lý",
                    dataIndex: "fixedClassIds",
                    width: 120,
                    align: "center",
                    type: "select",
                    options:
                      fixedClasses?.map((fc) => ({
                        value: fc.id,
                        label: fc.name,
                      })) || [],
                    render: (_, record) =>
                      record?.student ? `${record?.student?.fixedClass?.code || ""}` : "",
                  },
                  {
                    title: "Khoá",
                    dataIndex: "trainingCourseIds",
                    width: 120,
                    align: "center",
                    type: "select",
                    options:
                      trainingCourses?.map((tc) => ({
                        value: tc.id,
                        label: tc.name,
                      })) || [],
                    render: (_, record) =>
                      record?.student
                        ? `${record?.student?.fixedClass?.trainingCourse?.name || ""}`
                        : "",
                  },
                  {
                    title: "Trạng thái",
                    dataIndex: "statusSurvey",
                    align: "center",
                    type: "select",
                    width: 120,
                    options: [
                      {
                        value: true,
                        label: "Đã làm",
                      },
                      {
                        value: false,
                        label: "Chưa làm",
                      },
                    ],
                    render: (__, record) => {
                      return checkStatus(record) ? (
                        <Tag color="green">Đã làm</Tag>
                      ) : (
                        <Tag color="red">Chưa làm</Tag>
                      )
                    },
                  },
                  {
                    title: "Thao tác",
                    align: "center",
                    width: 70,
                    hidden: !can(
                      KHAO_THI_PERMISSION.KHAO_THI_BAO_CAO_KHAO_SAT_GIANG_VIEN,
                      "XEM_CHI_TIET"
                    ),
                    render: (_, record) => {
                      const result = checkStatus(record)
                      return (
                        <Row className="justify-center gap-0">
                          {can(
                            KHAO_THI_PERMISSION.KHAO_THI_BAO_CAO_KHAO_SAT_GIANG_VIEN,
                            "XEM_CHI_TIET"
                          ) && (
                            <Tooltip title="Xem khảo sát" placement="top">
                              <Eye
                                className={`m-0 ${!result ? "opacity-[0.5] pointer-events-none !cursor-not-allowed" : ""}`}
                                size={14}
                                onClick={() => {
                                  if (result) {
                                    onOpen({
                                      userId: record?.student?.userProfile?.id || "",
                                      surveyId: result?.surveyId || "",
                                      userName: `${record?.student?.userProfile?.lastName || ""} ${record?.student?.userProfile?.firstName || ""}`,
                                    })
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                        </Row>
                      )
                    },
                  },
                ]}
                data={data || []}
                pagination={false}
              />
              <div className="mt-2 px-3 py-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#666" }}>Tổng đã làm:</span>{" "}
                  <strong style={{ color: "#009a5c", fontSize: 16, fontWeight: "bold" }}>
                    {doneStudents}/{totalStudents}
                  </strong>
                </div>
              </div>
            </Col>
          </>
        )}
      </Row>
    </div>
  )
}

export default DanhSachHocVienToanDot
