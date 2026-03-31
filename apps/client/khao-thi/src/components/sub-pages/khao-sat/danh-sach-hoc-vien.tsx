import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import ExportStudentInSurvey from "@components/modal/export-list-student-in-survey"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { LectuerType } from "@pages/thiet-lap-khao-sat/khao-sat-cum"
import { useSession } from "@workspace/auth/react"
import {
  useFindManyFixedClass,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Col, Flex, Row, Skeleton, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { Eye } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function DanhSachHocVien({
  lecturer,
  selectedId,
}: {
  lecturer: LectuerType | null
  selectedId: string
}) {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""
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
  const router = useRouter()
  const { data: fixedClasses = [] } = useFindManyFixedClass({
    orderBy: { name: "asc" },
  })
  const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
    useFindManyTrainingCourse({
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    })

  const where = useMemo(() => {
    return {
      id: {
        in: lecturer?.survey?.map((item) => item.subjectClassId) as string[],
      },

      // ...(filters.statusSurvey &&
      //     filters.statusSurvey?.length === 1 &&
      //     filters.statusSurvey[0] === false && {
      //         surveySession: {
      //             none: {
      //                 surveyId: survey?.id,
      //             },
      //         },
      //     }),

      // ...(filters.name && {
      //     subjectClassStudent: {
      //         some: {
      //             student: {
      //                 userProfile: {
      //                     fullname: {
      //                                 contains: filters.name,
      //                                 mode: 'insensitive' as const,
      //                             }
      //                 },
      //             },
      //         },
      //     },
      // }),
      // ...(filters.code && {
      //     subjectClassStudent: {
      //         some: {
      //             student: {
      //                 code: {
      //                     contains: filters.code,
      //                     mode: 'insensitive' as const,
      //                 },
      //             },
      //         },
      //     },
      // }),
      // ...(filters.idCardNumber && {
      //     idCardNumber: {
      //         contains: filters.idCardNumber,
      //         mode: 'insensitive' as const,
      //     },
      // }),
      // ...(filters.phoneNumber && {
      //     phoneNumber: {
      //         contains: filters.phoneNumber,
      //         mode: 'insensitive' as const,
      //     },
      // }),
    }
  }, [lecturer, filters])
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
                          lectureId: lecturer?.id,
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
      enabled: lecturer?.survey && lecturer?.survey?.length > 0,
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

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen } = useDisclosure<{ userId: string; surveyId: string; userName?: string }>({
    tag: "ReviewSurveyModal",
  })

  return (
    <div>
      <Row gutter={[16, 4]}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <Col span={24}>
              <Flex justify="end">
                <ExportStudentInSurvey
                  query={where}
                  lecturer={lecturer || null}
                  selectedId={selectedId}
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
                  // {
                  //     title: 'STT',
                  //     width: 20,
                  //     align: 'center',
                  //     render: (_, __, index) =>
                  //         index + 1 + (currentPage - 1) * numberOfPages,
                  // },
                  {
                    title: "Mã SV",
                    dataIndex: "code",
                    width: 150,
                    type: "input",
                    render: (_, record) => record?.student?.code || "",
                  },
                  {
                    title: "Họ và tên",
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
                          {
                            // can(
                            //     KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                            //     'XEM_TAT_CA'
                            // )
                            can(
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
                            )
                          }
                        </Row>
                      )
                    },
                  },
                ]}
                data={data || []}
                pagination={false}
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  )
}

export default DanhSachHocVien
