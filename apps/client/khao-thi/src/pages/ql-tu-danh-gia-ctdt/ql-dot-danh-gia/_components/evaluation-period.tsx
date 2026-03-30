import { DownloadOutlined, PaperClipOutlined } from "@ant-design/icons"
import type { UploadedFileItem } from "@components/commons/documentPaths"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { useSchoolYearStore } from "@components/selecter-school-year"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { cn } from "@lib/utils"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import type { Prisma } from "@workspace/db/client"
import {
  useCountEvaluationPeriod,
  useFindManyEvaluationPeriod,
  useUpdateEvaluationPeriod,
} from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import { BookPlus, ChevronDown, ChevronUp } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import ExportReport from "./export-report"

export type EvaluationPeriodType = Prisma.EvaluationPeriodGetPayload<{
  include: {
    council: {
      select: {
        id: true
        name: true
        members: true
      }
    }
    schoolYear: {
      select: {
        name: true
      }
    }
    documentFiles: true
    _count: {
      select: {
        documentFiles: true
      }
    }
  }
}>

export default function EvaluationPeriod() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    startDate: undefined,
    endDate: undefined,
  })
  const { id: schoolYearId } = useSchoolYearStore()

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const where = useMemo(
    () => ({
      deletedAt: null,
      ...(schoolYearId ? { schoolYearId } : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
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
    [filters.name, filters.startDate, filters.endDate, schoolYearId]
  )

  const { data, refetch } = useFindManyEvaluationPeriod({
    where,
    include: {
      council: {
        select: {
          id: true,
          name: true,
          members: true,
        },
      },
      schoolYear: {
        select: {
          name: true,
        },
      },
      documentFiles: true,
      _count: {
        select: {
          documentFiles: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count, refetch: refetchCount } = useCountEvaluationPeriod({
    where: {
      ...where,
    },
  })

  const { onOpen: onOpenPutEvaluationPeriod } = useDisclosure<string>({
    tag: "PutEvaluationPeriod",
    onClose() {
      refetch()
      refetchCount()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
  async function handleDeleteEvaluationPeriod(id: string) {
    try {
      showSpinner()
      await updateEvaluationPeriod({
        where: { id },
        data: { deletedAt: new Date() },
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

  const handlePreviewFile = async (file: UploadedFileItem) => {
    try {
      return onOpenPreview({
        uri: getMinioUrl(file.path),
        name: file.name,
        mimeType: file.name.split(".").pop() || file.mimeType,
      })
    } catch (error) {
      message.error("Không thể mở file")
    }
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top">
            <Col span={24}>
              <Flex justify="end" gap={8}>
                {can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, "THEM") && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      onOpenPutEvaluationPeriod()
                    }}
                  >
                    <BookPlus />
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            className="h-[calc(100vh-230px)]"
            onRow={(record) => {
              return {
                onClick: () => {
                  evaluationPeriodStore.setState({
                    selectedEvaluationPeriodId: record.id,
                  })
                },
                className: cn(
                  selectedEvaluationPeriodId === record.id
                    ? "!bg-orange-200 hover:!bg-orange-200 [&>td]:!bg-orange-200 [&>td]:hover:!bg-orange-200"
                    : ""
                ),
              }
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên",
                dataIndex: "name",
                width: 250,
                align: "center",
                type: "input",
                render: (_, record) => {
                  return <div className="text-left">{record.name}</div>
                },
              },
              {
                title: "Hội đồng đánh giá",
                width: 250,
                align: "center",
                render: (_, record) => {
                  return <div className="text-left">{record.council?.name}</div>
                },
              },
              {
                title: (
                  <Tooltip title="Số lượng thành viên">
                    <span>SLTV</span>
                  </Tooltip>
                ),
                width: 60,
                align: "center",
                render: (_, record) => {
                  return <div>{record.council?.members?.length || 0}</div>
                },
              },
              {
                title: "Năm học",
                width: 70,
                render: (_, record) => record?.schoolYear?.name,
              },
              {
                title: "Ngày bắt đầu",
                dataIndex: "startDate",
                width: 70,
                type: "date",
                render: (_, record) =>
                  record?.startDate ? dayjs(record?.startDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Ngày kết thúc",
                dataIndex: "endDate",
                width: 70,
                type: "date",
                render: (_, record) =>
                  record?.endDate ? dayjs(record?.endDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Tài liệu hội đồng",
                align: "center",
                width: 70,
                render: (_, record) => record?._count?.documentFiles || 0,
              },
              {
                title: "Thao tác",
                align: "center",
                width: 100,
                fixed: "right",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                  "SUA",
                  "XOA",
                  "XEM_CHI_TIET"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center items-center gap-2">
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "XUAT_EXCEL"
                        ) && <ExportReport id={record?.id} />}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPutEvaluationPeriod(record?.id)
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: (e) => {
                                handleDeleteEvaluationPeriod(record?.id)
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
            expandable={{
              expandedRowRender: (record) => (
                <div className="bg-gray-50">
                  <p className="mb-3 font-semibold">Tài liệu hội đồng:</p>
                  {record.documentFiles && record.documentFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {record.documentFiles.map((file: UploadedFileItem) => (
                        <div
                          key={file.id}
                          className="flex items-center border border-solid border-[#D1D5DB] rounded p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <PaperClipOutlined
                            style={{
                              marginRight: 8,
                              color: "#595959",
                              fontSize: 16,
                            }}
                          />
                          <Tooltip title={file.name}>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                width: 400,
                              }}
                            >
                              {file.name}
                            </span>
                          </Tooltip>
                          <Tooltip title="Tải xuống">
                            <DownloadOutlined
                              style={{
                                marginLeft: 12,
                                cursor: "pointer",
                                color: "#595959",
                                fontSize: 14,
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                const link = document.createElement("a")
                                link.href = file.path
                                link.download = file.name
                                link.click()
                              }}
                            />
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Không có tài liệu</p>
                  )}
                </div>
              ),
              expandIcon: ({ expanded, onExpand, record }) => (
                <span
                  className="flex justify-center"
                  onClick={(e) => onExpand(record as EvaluationPeriodType, e)}
                >
                  {expanded ? <ChevronDown /> : <ChevronUp />}
                </span>
              ),
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

EvaluationPeriod.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
