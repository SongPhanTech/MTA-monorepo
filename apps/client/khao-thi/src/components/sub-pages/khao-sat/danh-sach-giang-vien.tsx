import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import ExportLecturerInSurvey from "@components/modal/export-list-lecturer-in-survey"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { cn } from "@lib/utils"
import type { LectuerType } from "@pages/thiet-lap-khao-sat/khao-sat-cum"
import { $Enums } from "@workspace/db/client"
import { useCountLecturer, useFindManyLecturer } from "@workspace/db/hooks"
import { Col, Flex, Row, Skeleton } from "antd"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

export default function DetailSurveyPage({
  selectedId,
  surveyId,
  setSurvey,
  onNavigateToParticipants,
}: {
  selectedId: string
  surveyId: string
  setSurvey: (value: LectuerType) => void
  onNavigateToParticipants?: () => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    subjectClassName: undefined,
    startDate: undefined,
    endDate: undefined,
    idCardNumber: undefined,
    phoneNumber: undefined,
    organizationId: undefined,
  })
  const where = useMemo(
    () => ({
      survey: {
        some: {
          clusterSurveyId: selectedId,
          subjectClass: {
            subject: {
              type: $Enums.SubjectVersionType.Normal,
            },
          },
        },
      },
      ...(filters.name && filters.name !== ""
        ? {
            OR: [
              {
                code: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              },
              {
                userProfile: filters.name
                  ? {
                      fullname: {
                        contains: filters.name,
                        mode: "insensitive" as const,
                      },
                    }
                  : {},
              },
            ],
          }
        : {}),

      ...(filters.subjectClassName && filters.subjectClassName !== ""
        ? ({
            survey: {
              some: {
                // BẮT BUỘC: Phải lặp lại điều kiện này để không bị mất lọc theo đợt
                clusterSurveyId: selectedId,
                subjectClass: {
                  // LOGIC CŨ
                  OR: [
                    {
                      code: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      name: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          } as any) // 'as any' ở đây để fix lỗi Union Type (lỗi survey lặp lại)
        : {}),
      ...(filters.idCardNumber && filters.idCardNumber !== ""
        ? {
            userProfile: {
              idCardNumber: {
                contains: filters.idCardNumber,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.phoneNumber && filters.phoneNumber !== ""
        ? {
            userProfile: {
              phoneNumber: {
                contains: filters.phoneNumber,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.organizationId && filters.organizationId !== ""
        ? {
            userProfile: {
              donVi: {
                OR: [
                  {
                    sMa: {
                      contains: filters.organizationId,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    sTen: {
                      contains: filters.organizationId,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    }),
    [filters, selectedId]
  )
  const { data = [], isLoading } = useFindManyLecturer(
    {
      where,
      include: {
        survey: {
          where: {
            clusterSurveyId: selectedId,
          },
          include: {
            surveySessions: true,
            surveyQuestion: true,
            clusterSurvey: true,
            subjectClass: true,
          },
        },
        userProfile: { include: { donVi: true } },
      },
      orderBy: [
        {
          userProfile: {
            firstName: "asc",
          },
        },
        {
          userProfile: {
            lastName: "asc",
          },
        },
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!selectedId,
    }
  )

  const { data: count } = useCountLecturer({
    where: {
      ...where,
      deletedAt: null,
    },
  })
  return (
    <Row gutter={[16, 8]}>
      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <Col span={24}>
            <Flex align="center" justify="space-between">
              <div className="text-base font-bold">{data[0]?.survey[0]?.clusterSurvey?.name}</div>
              <ExportLecturerInSurvey
                query={where}
                surveyName={data[0]?.survey[0]?.clusterSurvey?.name || ""}
                selectedId={selectedId}
              />
            </Flex>
          </Col>
          <Col span={24}>
            <Table
              className="h-[calc(100vh-230px)]"
              rowKey={"id"}
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPage(1)
              }}
              onRow={(record) => {
                return {
                  onClick: () => {
                    setSurvey(record as LectuerType)
                  },
                  onDoubleClick: () => {
                    setSurvey(record as LectuerType)
                    onNavigateToParticipants?.()
                  },
                  className: cn(surveyId === record.id ? "bg-orange-200" : ""),
                }
              }}
              columns={[
                {
                  title: "STT",
                  width: 20,
                  align: "center",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                },

                {
                  title: "Giảng viên",
                  dataIndex: "name",
                  type: "input",
                  render: (__, record) => {
                    // Kiểm tra xem có bất kỳ survey nào đã có session (người làm) chưa
                    const isDone = record.survey?.some((s: any) => s.surveySessions?.length > 0)

                    return (
                      <span className={cn(isDone ? "text-red-500 font-medium" : "text-black")}>
                        {`${record?.code} - ${record?.userProfile?.fullname}`}
                      </span>
                    )
                  },
                },
                {
                  title: "Lớp môn học",
                  dataIndex: "subjectClassName",
                  type: "input",
                  render: (__, record) => {
                    return record?.survey?.length ? (
                      <HtmlTruncate>
                        <ul>
                          {record?.survey?.map((i: any) => (
                            <li key={i.id}>
                              {i.subjectClass?.code || ""}- {i.subjectClass?.name || ""}
                            </li>
                          ))}
                        </ul>
                      </HtmlTruncate>
                    ) : (
                      ""
                    )
                  },
                },
                {
                  title: "CCCD",
                  dataIndex: "idCardNumber",
                  type: "input",
                  align: "center",
                  render: (__, record) => {
                    return record?.userProfile?.idCardNumber || ""
                  },
                },
                {
                  title: "SĐT",
                  dataIndex: "phoneNumber",
                  type: "input",
                  align: "center",
                  render: (__, record) => {
                    return record?.userProfile?.phoneNumber || ""
                  },
                },
                {
                  title: "ĐVQL",
                  dataIndex: "organizationId",
                  type: "input",
                  width: 100,
                  align: "center",
                  render: (__, record) => {
                    return record?.userProfile?.donVi?.sMa || ""
                  },
                },
                {
                  title: "Ngày bắt đầu",
                  dataIndex: "startDate",
                  type: "date",
                  width: 150,
                  render: (_, record) =>
                    record?.survey[0]?.startDate
                      ? dayjs(record?.survey[0]?.startDate).format("DD/MM/YYYY")
                      : "",
                },
                {
                  title: "Ngày kết thúc",
                  dataIndex: "endDate",
                  type: "date",
                  width: 150,
                  render: (_, record) =>
                    record?.survey[0]?.endDate
                      ? dayjs(record?.survey[0]?.endDate).format("DD/MM/YYYY")
                      : "",
                },
              ]}
              data={data}
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
        </>
      )}
    </Row>
  )
}
