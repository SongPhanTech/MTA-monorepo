import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useGetSurveysOfProfile } from "@workspace/libs/api/exam"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Pagination, Row, Tag, Tooltip, Tabs } from "antd"
import dayjs from "dayjs"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/router"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function DetailSurveyPage() {
  const { showSpinner, hideSpinner } = useSpinner()
  const router = useRouter()
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || "b5d1221b-06db-4fa8-8a1c-045996c1d4a2"
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [surveyType, setSurveyType] = useState<"SINGLE" | "CLUSTER">("SINGLE")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    subjectClassName: "",
    lecturerName: "",
  })
  // const where = useMemo(
  //     () => ({
  //         ...(filters.code && filters.code !== ''
  //             ? {
  //                   code: {
  //                       contains: filters.code,
  //                       mode: 'insensitive' as const,
  //                   },
  //               }
  //             : {}),
  //         ...(filters.name && filters.name !== ''
  //             ? {
  //                   name: {
  //                       contains: filters.name,
  //                       mode: 'insensitive' as const,
  //                   },
  //               }
  //             : {}),
  //         ...(filters.surveyId
  //             ? Array.isArray(filters.surveyId)
  //                 ? { surveyId: { in: filters.surveyId } }
  //                 : { surveyId: filters.surveyId }
  //             : {}),
  //         ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
  //             ? {
  //                   type: { in: filters.surveyQuestionType },
  //               }
  //             : {}),
  //     }),
  //     [filters]
  // )
  // const { data = [], refetch } = useFindManySurvey(
  //     {
  //         where,
  //         include: {
  //             clusterSurvey: true,
  //             surveyObjectType: true,
  //             lecture: {
  //                 include: {
  //                     userProfile: true,
  //                 },
  //             },
  //             subjectClass: {
  //                 include: {
  //                     subjectClassStudent: {
  //                         include: {
  //                             student: true,
  //                         },
  //                     },
  //                     subject: true,
  //                 },
  //             },
  //             surveyQuestion: true,
  //             surveySessions: true,
  //         },
  //         orderBy: { createdAt: 'desc' },
  //         take: numberOfPages,
  //         skip: (currentPage - 1) * numberOfPages,
  //     },
  //     {
  //         enabled: !!profileId,
  //     }
  // )

  const filterParams = {
    name: filters.name,
    code: filters.code,
    subjectClassName: filters.subjectClassName,
    lecturerName: filters.lecturerName,
    semesterId,
    trainingObjectTypeId,
    type: surveyType,
  }

  const { data } = useGetSurveysOfProfile(profileId as string, {
    page: currentPage,
    limit: numberOfPages,
    ...filterParams,
  })

  const { data: statsData } = useGetSurveysOfProfile(
    profileId as string,
    { page: 1, limit: 100, ...filterParams },
    { query: { enabled: !!profileId } }
  )

  const { onOpen } = useDisclosure<{ userId: string; surveyId: string }>({
    tag: "ReviewSurveyModal",
  })

  const totalCount = (data?.status === 200 && data?.data?.count) || 0
  const doneCount = (
    ((statsData?.status === 200 && statsData?.data?.data) || []) as {
      surveySessions?: unknown[]
    }[]
  ).filter((item) => (item.surveySessions?.length ?? 0) > 0).length

  // const { data: count } = useCountSurvey({
  //     where: {
  //         ...where,
  //         deletedAt: null,
  //     },
  // })
  return (
    <Row gutter={[16, 8]}>
      {/* <Col span={24}>
                <div className="text-lg font-bold">{data?.[0]?.clusterSurvey?.name}</div>
            </Col> */}
      <Col span={24}>
        <Tabs
          activeKey={surveyType}
          onChange={(key) => {
            setSurveyType(key as "SINGLE" | "CLUSTER")
            setCurrentPage(1)
          }}
          items={[
            { key: "SINGLE", label: "Khảo sát chung" },
            { key: "CLUSTER", label: "Khảo sát giảng viên" },
          ]}
          className="mb-0"
        />
        <Table
          className="h-[calc(100vh-200px)]"
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          columns={[
            {
              title: "STT",
              width: 20,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Đơt khảo sát",
              dataIndex: "name",
              type: "input",
              render: (__, record) => {
                return record?.name || ""
              },
            },
            {
              title: "Đối tượng được khảo sát",
              dataIndex: "lecturerName",
              type: "input",
              render: (__, record) => {
                return record?.lecture
                  ? `${record?.lecture?.code} - ${record?.lecture?.userProfile?.lastName} ${record?.lecture?.userProfile?.firstName}`
                  : ""
              },
            },
            {
              title: "Lớp môn học",
              dataIndex: "subjectClassName",
              type: "input",
              render: (__, record) => {
                return record?.lecture ? (
                  <div>
                    {record?.subjectClass?.code} - {record?.subjectClass?.name}
                  </div>
                ) : (
                  ""
                )
              },
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              type: "date",
              width: 120,
              render: (_, record) => {
                return (
                  <div className={`${dayjs().isAfter(record?.endDate) ? "text-red-500" : ""}`}>
                    {record?.startDate ? dayjs(record?.startDate).format("DD/MM/YYYY") : ""}
                  </div>
                )
              },
            },

            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              type: "date",
              width: 120,
              render: (_, record) => {
                return (
                  <div className={`${dayjs().isAfter(record?.endDate) ? "text-red-500" : ""}`}>
                    {record?.endDate ? dayjs(record?.endDate).format("DD/MM/YYYY") : ""}
                  </div>
                )
              },
            },
            {
              title: "Trạng thái",
              align: "center",
              width: 120,
              render: (_, record) => {
                return (
                  <Tag color={record?.surveySessions?.length > 0 ? "green" : "default"}>
                    {record?.surveySessions?.length > 0 ? "Đã làm" : "Chưa làm"}
                  </Tag>
                )
              },
            },

            {
              title: "Thao tác",
              width: 100,
              align: "center",
              render: (_, { id, isPublic, surveyQuestion, surveySessions }) => (
                <Row className="justify-end gap-2">
                  {surveyQuestion?.length > 0 && (
                    <Tooltip
                      className="mr-2"
                      title={surveySessions?.length > 0 ? "Xem khảo sát" : "Làm khảo sát"}
                      placement="top"
                    >
                      <div
                        className="flex items-center justify-center h-8 w-8 rounded-[50%] hover:bg-gray-200"
                        onClick={() => {
                          if (surveySessions?.length > 0) {
                            onOpen({
                              userId: profileId || "",
                              surveyId: id,
                            })
                            return
                          }
                          if (!isPublic) {
                            router.push(`/lam-khao-sat/private/${id}`)
                          } else {
                            router.push(`/lam-khao-sat/${id}`)
                          }
                        }}
                      >
                        <ArrowRight style={{ fontSize: "16px" }} />
                      </div>
                    </Tooltip>
                  )}
                </Row>
              ),
            },
          ]}
          data={(data?.status === 200 && data?.data?.data) || []}
          pagination={false}
        />
        <div className="mt-2 px-3 py-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#666" }}>Tổng đã làm:</span>{" "}
            <strong style={{ color: "#009a5c", fontSize: 16, fontWeight: "bold" }}>
              {doneCount}/{totalCount}
            </strong>
          </div>
          <Pagination
            size="small"
            current={currentPage}
            pageSize={numberOfPages}
            total={totalCount}
            showSizeChanger={{
              labelRender: ({ value }) => `${value} / trang`,
              optionRender: (oriOption) => `${oriOption.value} / trang`,
            }}
            showTotal={(total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`}
            onChange={(page, pageSize) => {
              if (numberOfPages === pageSize) {
                setCurrentPage(page)
              } else {
                setCurrentPage(1)
                setNumberOfPages(pageSize)
              }
            }}
          />
        </div>
      </Col>
    </Row>
  )
}
DetailSurveyPage.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
