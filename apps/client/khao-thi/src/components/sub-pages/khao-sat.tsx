import { EyeOutlined } from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { cn } from "@lib/utils"
import type { SchoolYear, Semester, Survey } from "@workspace/db"
import {
  useCountSurvey,
  useFindManySchoolYear,
  useFindManySurvey,
  useFindManySurveyObjectType,
  useFindManySurveyTopic,
  useUpdateSurvey,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Col, Flex, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import { Link } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function TabDotKhaoSat({
  selectedId,
  setSelectedId,
}: {
  selectedId: Survey | null
  setSelectedId: (value: Survey | null) => void
}) {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    surveyObjectTypeId: undefined,
    surveyTopicId: undefined,
    startDate: undefined,
    endDate: undefined,
    isPublic: undefined,
    anonymous: undefined,
    semesterIds: undefined,
  })
  const router = useRouter()
  const where = useMemo(
    () => ({
      clusterSurveyId: null,
      deletedAt: null,
      surveyTopic: { deletedAt: null },
      ...(semesterId ? { semesterId } : {}),
      ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.surveyObjectTypeId
        ? {
            surveyObjectType: {
              some: {
                id: {
                  in: filters.surveyObjectTypeId,
                },
              },
            },
          }
        : {}),
      ...(filters.isPublic && filters.isPublic.length === 1
        ? {
            isPublic: filters.isPublic[0],
          }
        : {}),
      ...(filters.anonymous && filters.anonymous.length === 1
        ? {
            anonymous: filters.anonymous[0],
          }
        : {}),
      ...(filters.surveyTopicId
        ? Array.isArray(filters.surveyTopicId)
          ? filters.surveyTopicId.length > 1
            ? { surveyTopicId: { in: filters.surveyTopicId } }
            : { surveyTopicId: { equals: filters.surveyTopicId[0] } }
          : { surveyTopicId: { equals: filters.surveyTopicId } }
        : {}),
      ...(filters.startDate?.length === 2
        ? {
            startDate: {
              gte: dayjs(filters.startDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.startDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.endDate?.length === 2
        ? {
            endDate: {
              gte: dayjs(filters.endDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.endDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }),
    [filters, semesterId, trainingObjectTypeId]
  )

  const { data = [], refetch } = useFindManySurvey({
    where,
    include: {
      surveyObjectType: true,
      surveyTopic: true,
      surveyQuestion: true,
      surveySessions: true,
      semester: true,
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const converData = (data: (SchoolYear & { semesters: Semester[] })[] | undefined) => {
    return (
      data?.map((schoolYear) => ({
        value: schoolYear.id,
        label: schoolYear.name,
        children:
          schoolYear?.semesters.map((semester) => ({
            value: semester.id,
            label: `${semester.name}`,
          })) || [],
      })) || []
    )
  }

  // Tạo treeData từ schoolYears và semesters
  const treeData = converData(schoolYears)

  const { data: count } = useCountSurvey({ where })

  const { onOpen } = useDisclosure<{ id: string; type: string }>({
    tag: "PutSurveyModal",
  })

  const { onOpen: onOpenKhaoSat } = useDisclosure<{ dataTable: any[]; id: string }>({
    tag: "ThongTinKhaoSatModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen({ id: "", type: "one" })
  }

  const { mutateAsync: updateSurvey } = useUpdateSurvey()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateSurvey({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
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

  const { data: surveyTopicData } = useFindManySurveyTopic({ orderBy: { createdAt: "desc" } })
  const { data: surveyObjectTypeData } = useFindManySurveyObjectType({
    orderBy: { name: "asc" },
  })

  const { onOpen: onOpenPrint } = useDisclosure<{ id: string }>({
    tag: "ModalPrintExamSurvey",
  })
  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT, "THEM") && (
                  <Button onClick={handleModal} type="primary" size="small">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
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
                  setSelectedId(record as Survey)
                },
                className: cn(selectedId?.id === record.id ? "bg-orange-200" : ""),
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
                title: "Tên đợt khảo sát",
                dataIndex: "name",
                type: "input",
              },

              {
                title: "Chủ đề KS",
                dataIndex: "surveyTopicId",
                type: "select",
                options: surveyTopicData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => (record?.surveyTopic ? record?.surveyTopic.name : ""),
              },
              {
                title: "ĐTLKS",
                dataIndex: "surveyObjectTypeId",
                type: "select",
                options: surveyObjectTypeData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.surveyObjectType?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.surveyObjectType?.map((i: any) => (
                          <li key={i.id}>- {i.name}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Học kỳ",
                dataIndex: "semesterIds",
                type: "tree_select",
                width: 175,
                options: treeData,
                render: (__, record) => {
                  return record?.semester?.name || ""
                },
              },
              {
                title: "Công khai",
                dataIndex: "isPublic",
                align: "center",
                width: 100,
                type: "select",
                options: [
                  {
                    value: true,
                    label: "Công khai",
                  },
                  {
                    value: false,
                    label: "Nội bộ",
                  },
                ],
                render: (_, record) => {
                  return <Checkbox checked={record?.isPublic} />
                },
              },

              {
                title: "Ẩn danh",
                dataIndex: "anonymous",
                align: "center",
                width: 100,
                type: "select",
                options: [
                  {
                    value: true,
                    label: "Ẩn danh",
                  },
                  {
                    value: false,
                    label: "Không ẩn danh",
                  },
                ],
                render: (_, record) => {
                  return <Checkbox checked={record?.anonymous} />
                },
              },
              {
                title: "Ngày BĐ",
                dataIndex: "startDate",
                type: "date",
                width: 100,
                render: (_, record) => {
                  return (
                    <div className={`${dayjs().isAfter(record?.endDate) ? "text-red-500" : ""}`}>
                      {record?.startDate ? dayjs(record?.startDate).format("DD/MM/YYYY") : ""}
                    </div>
                  )
                },
              },

              {
                title: "Ngày KT",
                dataIndex: "endDate",
                type: "date",
                width: 100,
                render: (_, record) => {
                  return (
                    <div className={`${dayjs().isAfter(record?.endDate) ? "text-red-500" : ""}`}>
                      {record?.endDate ? dayjs(record?.endDate).format("DD/MM/YYYY") : ""}
                    </div>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                  "THEM",
                  "SUA",
                  "XOA",
                  "XEM_CHI_TIET"
                ),
                render: (
                  _,
                  { id, isPublic, surveyQuestion, surveyObjectType, surveySessions, endDate }
                ) => (
                  <Row className="justify-center gap-2" wrap={false}>
                    {/* {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                            'XEM_CHI_TIET'
                                        ) &&
                                            surveySessions?.length > 0 && (
                                                <Tooltip
                                                    title={'Báo cáo khảo sát'}
                                                    placement="top"
                                                >
                                                    <BarChartOutlined
                                                        onClick={() => {
                                                            router.push(`/bao-cao-khao-sat/${id}`)
                                                        }}
                                                        style={{ fontSize: '16px' }}
                                                    />
                                                </Tooltip>
                                            )} */}
                    {surveyQuestion?.length > 0 &&
                      can(
                        KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                        "XEM_CHI_TIET"
                      ) && (
                        <Tooltip title={"Xem đề khảo sát"} placement="top">
                          <EyeOutlined
                            onClick={() => {
                              onOpenPrint({ id })
                            }}
                            style={{ fontSize: "16px" }}
                          />
                        </Tooltip>
                      )}

                    {surveyQuestion?.length > 0 &&
                      can(
                        KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                        "XEM_CHI_TIET"
                      ) &&
                      !!isPublic && (
                        <Tooltip title={"Lấy đường dẫn khảo sát công khai"} placement="top">
                          <Link
                            size={16}
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenKhaoSat({
                                dataTable: surveyObjectType,
                                id: id,
                              })
                              // router.push(`/lam-khao-sat/${id}`)
                            }}
                          />
                        </Tooltip>
                      )}
                    {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT, "SUA") && (
                      <EditIcon
                        disabled={surveySessions.length > 0}
                        onClick={() => onOpen({ id, type: "one" })}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}

                    {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT, "XOA") && (
                      <DeleteIcon
                        disabled={surveySessions.length > 0}
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
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
      </Row>
    </div>
  )
}

export default TabDotKhaoSat
