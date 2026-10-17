import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import { DownloadOutlined, EyeOutlined, PaperClipOutlined, SearchOutlined } from "@ant-design/icons"
import { useFindManyEvaluationPeriod, useUpdateEvidenceCategory } from "@workspace/db/hooks"
import type { Evidence, EvidenceFile } from "@workspace/db"
import type { Prisma } from "@workspace/db/client"
import type { XemBangChungFilesInput } from "@components/modal/xem-bang-chung-files-modal"
import { getMinioUrl, getRuntimeEnv } from "@workspace/libs/utils"
import { Col, Flex, Input, message, Row, Tag, Tooltip } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { FILE_SHOW_LIMIT } from "@constants/constants"
import { queryClient } from "@api/index"

export type PeriodWithEvidenceDetails = Prisma.EvaluationPeriodGetPayload<{
  include: {
    schoolYear: true
    evidenceCategories: {
      include: {
        evidences: {
          include: {
            evidenceFile: true
          }
        }
      }
    }
  }
}>

export interface EvidenceTableItem extends Evidence {
  categoryName: string
  categoryId: string
  periodId: string
  evidenceFile?: EvidenceFile[]
}

export interface EvaluationPeriodTableData extends PeriodWithEvidenceDetails {
  evidenceItems: EvidenceTableItem[]
}

function FileItem({
  file,
  onPreview,
}: {
  file: EvidenceFile
  onPreview: (file: EvidenceFile) => void
}) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const url = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${file.path}`
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      message.error("Không thể tải file")
    }
  }

  return (
    <div className="flex items-center gap-1 border border-solid border-[#D1D5DB] rounded px-2 py-1 bg-white w-[200px]">
      <PaperClipOutlined className="text-gray-500 text-xs flex-shrink-0" />
      <Tooltip title={file.name}>
        <span className="truncate text-xs flex-1 w-0">{file.name}</span>
      </Tooltip>
      <Tooltip title="Xem trước">
        <EyeOutlined
          className="text-blue-500 text-xs flex-shrink-0 cursor-pointer ml-1"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(file)
          }}
        />
      </Tooltip>
      <Tooltip title="Tải xuống">
        <DownloadOutlined
          className="text-gray-500 text-xs flex-shrink-0 cursor-pointer ml-1"
          onClick={handleDownload}
        />
      </Tooltip>
    </div>
  )
}

export default function PeriodEvidenceRepositoryTab() {
  const [filters, setFilters] = useState<FilterProps>({
    evidenceName: "",
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateEvidenceCategory } = useUpdateEvidenceCategory()

  const { data: rawPeriods, isLoading } = useFindManyEvaluationPeriod({
    where: {
      deletedAt: null,
      ...(filters.evidenceName
        ? {
            name: {
              contains: filters.evidenceName,
              mode: "insensitive" as const,
            },
          }
        : {}),
    },
    include: {
      schoolYear: true,
      evidenceCategories: {
        where: { deletedAt: null },
        include: {
          evidences: {
            where: { deletedAt: null },
            include: {
              evidenceFile: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const tableData = useMemo<EvaluationPeriodTableData[]>(() => {
    return (rawPeriods || []).map((period) => {
      const items: EvidenceTableItem[] = []
      for (const cat of period.evidenceCategories || []) {
        for (const ev of cat.evidences || []) {
          items.push({
            ...ev,
            categoryName: cat.name,
            categoryId: cat.id,
            periodId: period.id,
          })
        }
      }

      return {
        ...period,
        evidenceItems: items,
      }
    })
  }, [rawPeriods])

  const { onOpen: onOpenBangChungFiles } = useDisclosure<XemBangChungFilesInput>({
    tag: "XemBangChungFilesModal",
  })

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const handlePreviewFile = (file: EvidenceFile) => {
    onOpenPreview({
      uri: getMinioUrl(file.path),
      name: file.name,
      mimeType: file.name.split(".").pop() || file.mimeType || "",
    })
  }

  const { onOpen: onOpenPutEvidence } = useDisclosure<{
    id: string
    categoryId: string
  }>({
    tag: "PutEvidence",
  })

  const { onOpen: onOpenAttachCategory } = useDisclosure<string>({
    tag: "AttachEvidenceCategoryModal",
  })

  async function handleUnlinkCategoryFromPeriod(categoryId: string, periodId: string) {
    if (!categoryId || !periodId) return
    try {
      showSpinner()
      await updateEvidenceCategory({
        where: { id: categoryId },
        data: {
          evaluationPeriods: {
            disconnect: [{ id: periodId }],
          },
        },
      })
      message.success("Đã gỡ nhóm minh chứng khỏi đợt tự đánh giá thành công")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "EvidenceCategory"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "EvaluationPeriod"] })
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[16, 12]}>
      <Col span={24}>
        <Flex justify="space-between" align="center" className="mb-2">
          <Input
            className="w-[360px]"
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm kiếm theo tên đợt tự đánh giá..."
            allowClear
            onChange={(e) =>
              setFilters({
                ...filters,
                evidenceName: e.target.value,
              })
            }
          />
        </Flex>
      </Col>

      <Col span={24}>
        <TableCollapse
          loading={isLoading}
          rowKey="id"
          headerTitleKey={(record) => {
            const schoolYear = record.schoolYear?.name
              ? ` - Năm học: ${record.schoolYear.name}`
              : ""
            const count = record.evidenceItems?.length || 0
            return (
              <span className="font-semibold">
                {record.name} {schoolYear}{" "}
                <Tag color="blue" className="ml-2">
                  {count} minh chứng
                </Tag>
              </span>
            )
          }}
          childrenFieldName="evidenceItems"
          defaultExpandAll
          className="w-full"
          scroll={{ y: "calc(100vh - 220px)", x: "max-content" }}
          filters={filters}
          setFilters={(value) => setFilters(value)}
          headerRight={(record) => (
            <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
              <CreateIcon
                title="Gán nhóm minh chứng vào đợt"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAttachCategory(record.id)
                }}
              />
            </div>
          )}
          columns={[
            {
              title: "Nhóm minh chứng",
              dataIndex: "categoryName",
              width: 200,
              align: "left",
              render: (_, record) => (
                <span className="font-medium text-gray-700">{record?.categoryName || "-"}</span>
              ),
            },
            {
              title: "Mã minh chứng",
              width: 120,
              render: (_, record) => record?.suffix || "",
            },
            {
              title: "Tên minh chứng",
              dataIndex: "name",
              width: 240,
              align: "left",
              type: "input",
              sorter: (a, b) =>
                (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()),
              showSorterTooltip: false,
              render: (_, record) => record?.name || "",
            },
            {
              title: "Số, ngày/tháng ban hành",
              width: 200,
              align: "left",
              render: (_, record) => record?.information || "",
            },
            {
              title: "Nơi ban hành",
              type: "input",
              dataIndex: "issuer",
              width: 140,
              align: "left",
              render: (_, record) => record?.issuer || "",
            },
            {
              title: "Bằng chứng",
              width: 220,
              align: "left",
              render: (_, record) => {
                const files: EvidenceFile[] = record?.evidenceFile ?? []
                if (!files.length) return null
                const visible = files.slice(0, FILE_SHOW_LIMIT)
                const remaining = files.length - FILE_SHOW_LIMIT
                return (
                  <div className="flex flex-col gap-1">
                    {visible.map((file) => (
                      <FileItem key={file.id} file={file} onPreview={handlePreviewFile} />
                    ))}
                    {remaining > 0 && (
                      <span
                        className="text-green-600 cursor-pointer text-xs text-right"
                        onClick={() =>
                          onOpenBangChungFiles({ files, evidenceName: record?.name ?? "" })
                        }
                      >
                        Xem thêm ({remaining})
                      </span>
                    )}
                  </div>
                )
              },
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              render: (_, record) => (
                <div className="flex justify-center gap-2.5 items-center">
                  <EditIcon
                    title="Chỉnh sửa minh chứng"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPutEvidence({
                        id: record?.id,
                        categoryId: record?.categoryId,
                      })
                    }}
                    className="text-sm text-blue-700 cursor-pointer"
                  />
                  <DeleteIcon
                    title="Gỡ nhóm minh chứng khỏi đợt tự đánh giá"
                    popConfirm={{
                      title: "Bạn có chắc chắn muốn gỡ nhóm minh chứng này khỏi đợt tự đánh giá?",
                      onConfirm: (e) => {
                        handleUnlinkCategoryFromPeriod(record?.categoryId, record?.periodId)
                        e?.stopPropagation()
                      },
                      onCancel: (e) => {
                        e?.stopPropagation()
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ),
            },
          ]}
          data={tableData}
        />
      </Col>
    </Row>
  )
}
