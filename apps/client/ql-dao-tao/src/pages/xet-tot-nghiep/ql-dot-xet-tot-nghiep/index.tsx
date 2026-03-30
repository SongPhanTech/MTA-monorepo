import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useGraduationSessionStatusOptions } from "@hooks/graduationSessionStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountGraduationSession,
  useFindManyGraduationSession,
  useUpdateGraduationSession,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { BookPlus, Eye } from "lucide-react"
import { useRouter } from "next/router"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function GraduationSession() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const {
    graduationSessionStatusOptions,
    getGraduationSessionStatusLabel,
    getGraduationSessionStatusColor,
  } = useGraduationSessionStatusOptions()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    sessionDate: undefined,
    applicationStart: undefined,
    applicationEnd: undefined,
    statusGraduationSession: undefined,
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: graduationSessionData } = useFindManyGraduationSession({
    where: {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.sessionDate?.length === 2
        ? {
            sessionDate: {
              gte: dayjs(filters.sessionDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.sessionDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.applicationStart?.length === 2
        ? {
            applicationStart: {
              gte: dayjs(filters.applicationStart?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.applicationStart?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.applicationEnd?.length === 2
        ? {
            applicationEnd: {
              gte: dayjs(filters.applicationEnd?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.applicationEnd?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.statusGraduationSession
        ? Array.isArray(filters.statusGraduationSession)
          ? {
              status: {
                in: filters.statusGraduationSession,
              },
            }
          : {
              status: {
                equals: filters.statusGraduationSession,
              },
            }
        : {}),
      trainingObjectTypeId,
    },
    include: {
      trainingObjectType: true,
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountGraduationSession({
    where: {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.sessionDate?.length === 2
        ? {
            sessionDate: {
              gte: dayjs(filters.sessionDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.sessionDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.applicationStart?.length === 2
        ? {
            applicationStart: {
              gte: dayjs(filters.applicationStart?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.applicationStart?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.applicationEnd?.length === 2
        ? {
            applicationEnd: {
              gte: dayjs(filters.applicationEnd?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.applicationEnd?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.statusGraduationSession
        ? Array.isArray(filters.statusGraduationSession)
          ? {
              status: {
                in: filters.statusGraduationSession,
              },
            }
          : {
              status: {
                equals: filters.statusGraduationSession,
              },
            }
        : {}),
      trainingObjectTypeId,
      deletedAt: null,
    },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "PutGraduationSession",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateGraduationSession } = useUpdateGraduationSession()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateGraduationSession({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
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

  const handleRowClick = (record: { id?: string }) => {
    if (
      can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP, "XEM_CHI_TIET") &&
      record?.id
    ) {
      router.push(`${ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP}/${record.id}`)
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                  "THEM"
                ) && (
                  <Button onClick={handleModal} type="primary">
                    <BookPlus />
                    Thêm
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="key"
            id="graduation-session"
            onRowClick={(record) => handleRowClick(record)}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên đợt",
                dataIndex: "name",
                width: 180,
                type: "input",
                align: "center",
              },
              {
                title: "Đối tượng đào tạo",
                width: 180,
                align: "center",
                render: (_, record) => record?.trainingObjectType?.name || "",
              },
              {
                title: "Ngày họp hội đồng",
                dataIndex: "sessionDate",
                width: 140,
                type: "date",
                align: "center",
                render: (record: string) => (record ? dayjs(record).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Ngày bắt đầu nhận đơn",
                dataIndex: "applicationStart",
                width: 160,
                type: "date",
                align: "center",
                render: (record: string) => (record ? dayjs(record).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Ngày kết thúc nhận đơn",
                dataIndex: "applicationEnd",
                width: 170,
                type: "date",
                align: "center",
                render: (record: string) => (record ? dayjs(record).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Trạng thái",
                dataIndex: "statusGraduationSession",
                align: "center",
                width: 160,
                fixed: "right",
                type: "select",
                options: graduationSessionStatusOptions,
                render: (_, record) => {
                  const label = getGraduationSessionStatusLabel(record?.status)
                  const color = getGraduationSessionStatusColor(record?.status)
                  return <Tag color={color}>{label}</Tag>
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                  "XEM_CHI_TIET",
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                          "XEM_CHI_TIET"
                        ) && (
                          <Tooltip title="Xem chi tiết" placement="top">
                            <Eye size={16} strokeWidth={1.5} className="text-base cursor-pointer" />
                          </Tooltip>
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpen(id)
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: (e) => {
                                e?.stopPropagation()
                                handleDelete(id)
                              },
                              onCancel: (e) => {
                                e?.stopPropagation()
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
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
            data={graduationSessionData}
          />
        </Col>
      </Row>
    </div>
  )
}

GraduationSession.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
