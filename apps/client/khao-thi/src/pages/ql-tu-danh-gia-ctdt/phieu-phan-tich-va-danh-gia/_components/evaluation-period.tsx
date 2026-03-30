import { DownloadOutlined, PaperClipOutlined } from "@ant-design/icons"
import type { UploadedFileItem } from "@components/commons/documentPaths"
import Table from "@components/commons/table"
import { useSchoolYearStore } from "@components/selecter-school-year"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { cn, formatDate } from "@lib/utils"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import type { EvaluationPeriodType } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-period"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import {
  useCountEvaluationPeriod,
  useFindManyEvaluationPeriod,
  useFindUniqueLecturer,
} from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Col, message, Row, Tooltip } from "antd"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function EvaluationPeriod() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "7247c121-ab5a-4a72-a018-4a4090c7948a"
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { id: schoolYearId } = useSchoolYearStore()

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const { data: lecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: idProfile || "",
      },
    },
    {
      enabled: !!idProfile,
    }
  )

  const whereClause = useMemo(() => {
    return {
      OR: [
        {
          standards: {
            some: {
              criteria: {
                some: {
                  analysisCriterions: {
                    lecturer: {
                      userProfile: {
                        id: idProfile,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          council: {
            members: {
              some: {
                lecturerId: lecturer?.id,
                OR: [
                  { role: $Enums.EvaluationMemberRole.ADVISORY_BOARD },
                  { role: $Enums.EvaluationMemberRole.HEAD_SECRETARY },
                  { role: $Enums.EvaluationMemberRole.HEAD_SPECIALIZED },
                ],
              },
            },
          },
        },
      ],
      ...(schoolYearId && { schoolYearId }),
      deletedAt: null,
    }
  }, [idProfile, schoolYearId, lecturer?.id])

  const { data: assignments = [], isLoading } = useFindManyEvaluationPeriod(
    {
      where: whereClause,
      include: {
        council: {
          select: {
            id: true,
            name: true,
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
    },
    {
      enabled: !!idProfile,
    }
  )

  const { data: count } = useCountEvaluationPeriod(
    {
      where: whereClause,
    },
    {
      enabled: !!idProfile,
    }
  )

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
    <Row gutter={[8, 0]}>
      <Col span={24}>
        <Table
          rowKey="id"
          data={assignments}
          loading={isLoading}
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
              width: 30,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
            },
            {
              title: "Tên đợt đánh giá",
              width: 220,
              align: "center",
              render: (_, record) => {
                return <div className="text-left">{record?.name}</div>
              },
            },
            {
              title: "Hội đồng đánh giá",
              width: 220,
              render: (_, record) => {
                return <div className="text-left">{record.council?.name}</div>
              },
            },
            {
              title: "Năm học",
              align: "center",
              width: 160,
              render: (_, record) => record.schoolYear?.name,
            },
            {
              title: "Ngày bắt đầu",
              align: "center",
              width: 150,
              render: (_, record) => (record?.startDate ? formatDate(record.startDate) : undefined),
            },
            {
              title: "Ngày kết thúc",
              width: 150,
              align: "center",
              render: (_, record) => (record?.endDate ? formatDate(record.endDate) : undefined),
            },
            {
              title: "Tài liệu hội đồng",
              align: "center",
              width: 120,
              render: (_, record) => record?._count?.documentFiles || 0,
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
          expandable={{
            expandedRowRender: (record) => (
              <div className="bg-gray-50">
                <p className="mb-3 font-semibold">Tài liệu hội đồng:</p>
                {record?.documentFiles && record.documentFiles.length > 0 ? (
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
  )
}
