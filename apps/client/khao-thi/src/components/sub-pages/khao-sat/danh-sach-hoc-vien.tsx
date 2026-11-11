import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import ExportStudentInSurvey from "@components/modal/export-list-student-in-survey"
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
            deletedAt: null,
            withdrew: false,
            student: {
              ...(filters.name ||
              filters.code ||
              filters.idCardNumber ||
              filters.phoneNumber ||
              filters.dateOfBirth?.length === 2 ||
              (filters.statusSurvey && filters.statusSurvey.length === 1)
                ? {
                    userProfile: {
                      ...(filters.name
                        ? {
                            fullname: {
                              contains: filters.name,
                              mode: "insensitive" as const,
                            },
                          }
                        : {}),
                      ...(filters.code
                        ? {
                            code: {
                              contains: filters.code,
                              mode: "insensitive" as const,
                            },
                          }
                        : {}),
                      ...(filters.idCardNumber
                        ? {
                            idCardNumber: {
                              contains: filters.idCardNumber,
                              mode: "insensitive" as const,
                            },
                          }
                        : {}),
                      ...(filters.phoneNumber
                        ? {
                            phoneNumber: {
                              contains: filters.phoneNumber,
                              mode: "insensitive" as const,
                            },
                          }
                        : {}),
                      ...(filters.dateOfBirth?.length === 2
                        ? {
                            dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                            },
                          }
                        : {}),
                      ...(filters.statusSurvey && filters.statusSurvey.length === 1
                        ? {
                            surveySession:
                              filters.statusSurvey[0] === true
                                ? {
                                    some: {
                                      survey: {
                                        lectureId: lecturer?.id,
                                        clusterSurveyId: selectedId,
                                      },
                                    },
                                  }
                                : {
                                    none: {
                                      survey: {
                                        lectureId: lecturer?.id,
                                        clusterSurveyId: selectedId,
                                      },
                                    },
                                  },
                          }
                        : {}),
                    },
                  }
                : {}),
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
    },
    {
      enabled: lecturer?.survey && lecturer?.survey?.length > 0,
    }
  )

  const checkStatus = (record: any) => {
    const surveyIds = new Set(
      (lecturer?.survey || [])
        .filter((survey) => survey.subjectClassId === record?.subjectClassId)
        .map((survey) => survey.id)
    )
    if (record?.student?.userProfile?.surveySession?.length > 0) {
      const result = record?.student?.userProfile?.surveySession?.find(
        (item: any) => item?.isCompleted && surveyIds.has(item?.surveyId)
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

  const isFiltering = Boolean(
    filters.name ||
    filters.code ||
    filters.idCardNumber ||
    filters.phoneNumber ||
    filters.dateOfBirth?.length === 2 ||
    (filters.statusSurvey && filters.statusSurvey.length === 1) ||
    filters.fixedClassIds?.length ||
    filters.trainingCourseIds?.length
  )

  const displayData = useMemo(() => {
    if (!data) return []
    if (!isFiltering) return data
    return data.filter((item: any) => (item.subjectClassStudent || []).length > 0)
  }, [data, isFiltering])

  const { totalClasses, totalSurveys, doneSurveys, uniqueStudentsCount } = useMemo(() => {
    const list = displayData || []
    let total = 0
    let done = 0
    const studentSet = new Set<string>()

    list.forEach((subjectClass: any) => {
      const students = subjectClass?.subjectClassStudent || []
      total += students.length
      students.forEach((studentRecord: any) => {
        const studentId = studentRecord?.student?.id || studentRecord?.student?.userProfile?.id
        if (studentId) studentSet.add(studentId)
        if (checkStatus(studentRecord)) {
          done++
        }
      })
    })

    return {
      totalClasses: list.length,
      totalSurveys: total,
      doneSurveys: done,
      uniqueStudentsCount: studentSet.size,
    }
  }, [displayData, lecturer])

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
                  Giảng viên: {lecturer?.userProfile?.code} -{" "}
                  {(lecturer as any)?.userProfile?.fullname || "Chưa xác định"}
                </div>

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
                headerTitleKey={(record: any) => {
                  const classLabel = [record?.code, record?.name].filter(Boolean).join(" - ")
                  const studentsCount = record?.subjectClassStudent?.length || 0
                  const doneCount =
                    record?.subjectClassStudent?.filter((s: any) => checkStatus(s))?.length || 0

                  return (
                    <div className="flex flex-wrap items-center justify-between w-full py-1 pr-6 gap-x-4 gap-y-1">
                      <span className="font-semibold text-gray-900 text-sm">{classLabel}</span>
                      <div className="text-xs text-gray-600">
                        Đã làm:{" "}
                        <strong
                          className={
                            doneCount === studentsCount && studentsCount > 0
                              ? "text-green-600 font-bold"
                              : "text-blue-600 font-bold"
                          }
                        >
                          {doneCount}/{studentsCount}
                        </strong>{" "}
                        lượt
                      </div>
                    </div>
                  )
                }}
                setFilters={(value) => {
                  setFilters(value)
                }}
                scroll={{ y: "calc(100vh - 225px)", x: "max-content" }}
                className="w-full"
                hideDefaultSTT={true}
                columns={[
                  {
                    title: "STT",
                    width: 60,
                    align: "center",
                    render: (_, record, index) => (record.$type === "child" ? index + 1 : ""),
                  },
                  {
                    title: "Mã định danh",
                    dataIndex: "code",
                    width: 150,
                    type: "input",
                    render: (_, record) => record?.student?.userProfile?.code || "",
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
                data={displayData || []}
                pagination={false}
              />
              <div className="mt-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span>
                    Tổng số lớp môn học: <strong>{totalClasses}</strong>
                  </span>
                  <span>
                    Tổng số học viên: <strong>{uniqueStudentsCount}</strong>
                  </span>
                  <span>
                    Tổng lượt khảo sát:{" "}
                    <strong className="text-emerald-600 text-base font-bold">
                      {doneSurveys} / {totalSurveys}
                    </strong>{" "}
                    ({totalSurveys > 0 ? ((doneSurveys / totalSurveys) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </Col>
          </>
        )}
      </Row>
    </div>
  )
}

export default DanhSachHocVien
