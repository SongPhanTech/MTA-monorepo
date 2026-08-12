import { queryClient } from "@api/index"
import { useSession } from "@workspace/auth/react"
import Select from "@components/commons/select"

import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import EvaluateLayout from "@layouts/evaluate-layout"
import { DownloadOutlined, EyeOutlined, PaperClipOutlined } from "@ant-design/icons"
import { useDeleteEvidenceCategory, useFindManyEvidenceCategory } from "@workspace/db/hooks"
import type { EvidenceFile } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import type { XemBangChungFilesInput } from "@components/modal/xem-bang-chung-files-modal"
import { sqlTransaction } from "@workspace/libs/api/model"
import { getMinioUrl, getRuntimeEnv } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, Input, message, Row, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { FILE_SHOW_LIMIT, STANDARD_CATALOG_TYPE_OPTIONS } from "@constants/constants"

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

export default function EvidenceCategory() {

  const { can, canSome } = useAbility()
  const { data: session } = useSession()

  const [filters, setFilters] = useState<FilterProps>({
    evidenceName: "",
    issuer: "",
  })
  const [objectTypeFilter, setObjectTypeFilter] = useState<$Enums.StandardCatalogType>()

  const categoryWhere = useMemo(
    () => ({
      deletedAt: null,
      ...(objectTypeFilter ? { objectType: objectTypeFilter } : {}),
    }),
    [objectTypeFilter]
  )

  const where = useMemo(() => {
    const userFilters: { createdBy: string }[] = []
    if (session?.sDM_NhanVienId) {
      userFilters.push({ createdBy: session.sDM_NhanVienId })
    }
    if (session?.userId && session.userId !== session.sDM_NhanVienId) {
      userFilters.push({ createdBy: session.userId })
    }

    return {
      deletedAt: null,
      ...(userFilters.length > 0 ? { OR: userFilters } : {}),
      ...(filters.evidenceName
        ? {
            name: {
              contains: filters.evidenceName,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.issuer
        ? {
            issuer: {
              contains: filters.issuer,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }
  }, [filters.evidenceName, filters.issuer, session?.sDM_NhanVienId, session?.userId])


  const { data } = useFindManyEvidenceCategory({
    where: categoryWhere,
    include: {
      evidences: {
        where,
        orderBy: [{ name: "desc" }],
        include: {
          evidenceFile: true,
          _count: { select: { analysisFormEvidence: true } },
        },
      },
    },
    orderBy: [{ name: "desc" }],
  })

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

  const { onOpen: onOpenPutEvidenceCategory } = useDisclosure<string>({
    tag: "PutEvidenceCategory",
  })

  const { onOpen: onOpenPutEvidence } = useDisclosure<{
    id: string
    categoryId: string
  }>({
    tag: "PutEvidence",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: deleteEvidenceCategory } = useDeleteEvidenceCategory()
  async function handleDeleteEvidenceCategory(id: string) {
    try {
      showSpinner()
      await deleteEvidenceCategory({
        where: { id },
      })
      message.success("Xóa thành công")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "EvidenceCategory"] })
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

  async function handleDeleteEvidence(id: string, analysisFormEvidenceCount: number) {
    if (analysisFormEvidenceCount > 0) {
      message.error("Minh chứng đã được đưa vào phiếu phân tích, không thể xóa")
      return
    }

    try {
      showSpinner()
      const res = await sqlTransaction([
        {
          model: "EvidenceFile",
          operation: "deleteMany",
          data: { where: { evidenceId: id } },
        },
        {
          model: "Evidence",
          operation: "delete",
          data: { where: { id } },
        },
      ])

      if (res.status !== 200) {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
        return
      }

      message.success("Xóa thành công")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "EvidenceCategory"] })
    } catch (error: any) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24} className="mb-2">
          <Flex justify="space-between" align="center">
            <Flex gap={12}>
              <Input
                className="w-[27rem]"
                placeholder="Nhập tên minh chứng,nơi ban hành"
                allowClear
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    evidenceName: e.target.value,
                  })
                }
              />
              <Select
                className="w-[16rem]"
                allowClear
                placeholder="Loại nhóm minh chứng"
                options={STANDARD_CATALOG_TYPE_OPTIONS}
                value={objectTypeFilter}
                onChange={(value) => setObjectTypeFilter(value)}
              />
            </Flex>
            {can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG, "THEM") && (
              <Button
                type="primary"
                onClick={() => {
                  onOpenPutEvidenceCategory()
                }}
              >
                <BookPlus />
                Thêm mới nhóm
              </Button>
            )}
          </Flex>
        </Col>

        <Col span={24}>
          <TableCollapse
            rowKey="id"
            headerTitleKey={(record) => {
              const objectTypeLabel = STANDARD_CATALOG_TYPE_OPTIONS.find(
                (option) => option.value === record.objectType
              )?.label

              return [record.name, objectTypeLabel].filter(Boolean).join(" - ")
            }}
            childrenFieldName="evidences"
            defaultExpandAll
            className="w-full"
            scroll={{ y: "calc(100vh - 200px)", x: "max-content" }}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
            }}
            headerRight={(record) => (
              <div className="flex gap-2.5 w-[85px] items-center">
                {can(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                  "THEM"
                ) && (
                  <CreateIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPutEvidence({
                        id: "",
                        categoryId: record?.id,
                      })
                    }}
                    title="Thêm mới minh chứng"
                  />
                )}
                {can(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                  "SUA"
                ) && (
                  <EditIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPutEvidenceCategory(record?.id)
                    }}
                    className="text-sm text-blue-700 cursor-pointer"
                  />
                )}
                {can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG, "XOA") &&
                  (() => {
                    const hasEvidences = (record?.evidences?.length ?? 0) > 0

                    return (
                      <Tooltip
                        placement="top"
                        title={hasEvidences ? "Không thể xóa vì nhóm đã có minh chứng" : ""}
                      >
                        <DeleteIcon
                          disabled={hasEvidences}
                          className={
                            hasEvidences ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                          }
                          popConfirm={
                            hasEvidences
                              ? undefined
                              : {
                                  onConfirm: (e) => {
                                    handleDeleteEvidenceCategory(record?.id)
                                    e?.stopPropagation()
                                  },
                                  onCancel: (e) => {
                                    e?.stopPropagation()
                                  },
                                }
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>
                    )
                  })()}
              </div>
            )}
            columns={[
              {
                title: "Mã minh chứng",
                width: 100,
                render: (_, record) => record?.suffix || "",
              },
              {
                title: "Tên minh chứng",
                dataIndex: "evidenceName",
                width: 200,
                align: "left",
                type: "input",
                sortDirections: ["ascend", "descend"],
                sorter: (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
                showSorterTooltip: false,
                render: (__, record) => record?.name,
              },
              {
                title: "Số, ngày/tháng ban hành",
                width: 200,
                align: "left",
                render: (_, record) => (record?.information ? record.information : ""),
              },
              {
                title: "Nơi ban hành",
                type: "input",
                dataIndex: "issuer",
                width: 120,
                align: "left",
                render: (_, record) => (record?.issuer ? record.issuer : ""),
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
                title: "Ghi chú",
                width: 100,
                align: "left",
                dataIndex: "description",
                render: (value: string) => {
                  return (
                    <Tooltip title={value}>
                      <div className="line-clamp-2">{value}</div>
                    </Tooltip>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                  "SUA",
                  "XOA"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPutEvidence({
                                id: record?.id,
                                categoryId: record?.categoryId,
                              })
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                          "XOA"
                        ) &&
                          (() => {
                            const inAnalysisForm = (record?._count?.analysisFormEvidence ?? 0) > 0

                            return (
                              <Tooltip
                                placement="top"
                                title={
                                  inAnalysisForm
                                    ? "Minh chứng đã được đưa vào phiếu phân tích, không thể xóa"
                                    : ""
                                }
                              >
                                <DeleteIcon
                                  disabled={inAnalysisForm}
                                  className={
                                    inAnalysisForm
                                      ? "opacity-50 cursor-not-allowed"
                                      : "cursor-pointer"
                                  }
                                  popConfirm={
                                    inAnalysisForm
                                      ? undefined
                                      : {
                                          onConfirm: (e) => {
                                            handleDeleteEvidence(
                                              record?.id,
                                              record?._count?.analysisFormEvidence ?? 0
                                            )
                                            e?.stopPropagation()
                                          },
                                          onCancel: (e) => {
                                            e?.stopPropagation()
                                          },
                                        }
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Tooltip>
                            )
                          })()}
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            data={data}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

EvidenceCategory.getLayout = function getLayout(page: React.ReactElement) {
  return <EvaluateLayout>{page}</EvaluateLayout>
}
