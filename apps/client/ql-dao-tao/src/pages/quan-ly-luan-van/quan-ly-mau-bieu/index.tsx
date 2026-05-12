import { UploadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { generatePresignedUrl, presignedGetObject, useListObjects } from "@workspace/libs/api/model"
import type { BucketItemDto } from "@workspace/libs/api/schemas"
import { Button, Col, Flex, message, Row, Tag, Tooltip, Upload } from "antd"
import axios from "axios"
import dayjs from "dayjs"
import { Download, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const LUAN_VAN_PREFIX = "luan-van/"
const LUAN_VAN_PATH = "luan-van"
/** Lấy toàn bộ object trong prefix; phân trang chỉ ở FE (số lượng mẫu biểu nhỏ). */
const LIST_ALL_OBJECTS_LIMIT = 10_000
const MAX_UPLOAD_SIZE_MB = 50
const ACCEPT_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.jpg,.jpeg,.png"

const splitFileName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf(".")
  if (lastDot <= 0) return { baseName: fileName, extension: "" }
  return {
    baseName: fileName.slice(0, lastDot),
    extension: fileName.slice(lastDot + 1),
  }
}

const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return ""
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const stripPrefix = (name: string | undefined) => {
  if (!name) return ""
  return name.startsWith(LUAN_VAN_PREFIX) ? name.slice(LUAN_VAN_PREFIX.length) : name
}

const getDisplayName = (item: BucketItemDto) => stripPrefix(item.name || item.prefix || "")

const normalizeBucketItems = (value: unknown): BucketItemDto[] => {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object" && "data" in value) {
    const nestedData = (value as { data?: unknown }).data
    if (Array.isArray(nestedData)) return nestedData
  }
  return []
}

export default function QuanLyMauBieu() {
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGINATE_SIZE)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [uploading, setUploading] = useState<boolean>(false)

  const { showSpinner, hideSpinner } = useSpinner()

  const queryParams = useMemo(
    () => ({
      path: LUAN_VAN_PREFIX,
      limit: LIST_ALL_OBJECTS_LIMIT,
    }),
    []
  )

  const { data, isFetching, refetch } = useListObjects(queryParams, {
    query: {
      placeholderData: (prev) => prev,
    },
  })

  const allItems = useMemo(
    () =>
      normalizeBucketItems(data?.data).map((item) => ({
        ...item,
        name: item.name || item.prefix || "",
      })),
    [data]
  )

  const totalCount = allItems.length
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1)

  useEffect(() => {
    if (currentPage > maxPage) setCurrentPage(maxPage)
  }, [currentPage, maxPage])

  const items = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allItems.slice(start, start + pageSize)
  }, [allItems, currentPage, pageSize])

  const handleReload = () => {
    setCurrentPage(1)
    refetch()
  }

  const handleOpen = async (objectName?: string) => {
    if (!objectName) return
    try {
      showSpinner()
      const res = await presignedGetObject({ objectName })
      window.open(res.data.url, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error(error)
      message.error("Không thể tải file. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const handleDownload = async (objectName?: string) => {
    if (!objectName) return
    try {
      showSpinner()
      const res = await presignedGetObject({ objectName })
      const response = await fetch(res.data.url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const downloadName = stripPrefix(objectName) || objectName
      const anchor = document.createElement("a")
      anchor.href = blobUrl
      anchor.download = downloadName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error(error)
      message.error("Không thể tải file. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const uploadSingle = async (file: File) => {
    const { baseName, extension } = splitFileName(file.name)
    const resPresignedUrl = await generatePresignedUrl({
      path: LUAN_VAN_PATH,
      extension,
      name: baseName || undefined,
      flat: true,
    })

    await axios.put(resPresignedUrl.data.url, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
    })
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      showSpinner()
      await uploadSingle(file)
      message.success(`Đã tải lên "${file.name}".`)
      setCurrentPage(1)
      await refetch()
    } catch (error) {
      console.error(error)
      message.error(`Không thể tải lên "${file.name}". Vui lòng thử lại.`)
    } finally {
      setUploading(false)
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <h2 className="text-base font-semibold m-0">
              Quản lý mẫu biểu/tài liệu phòng sau đại học
            </h2>
            <Flex gap={8}>
              <Upload
                multiple
                accept={ACCEPT_EXTENSIONS}
                showUploadList={false}
                beforeUpload={(file: File) => {
                  const isValidSize = file.size / 1024 / 1024 < MAX_UPLOAD_SIZE_MB
                  if (!isValidSize) {
                    message.error(`"${file.name}" vượt quá ${MAX_UPLOAD_SIZE_MB}MB.`)
                    return Upload.LIST_IGNORE
                  }
                  handleUpload(file)
                  return false
                }}
              >
                <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
                  Tải file lên
                </Button>
              </Upload>
              <Button icon={<RefreshCcw size={14} />} onClick={handleReload} loading={isFetching}>
                Tải lại
              </Button>
            </Flex>
          </Flex>
        </Col>

        <Col span={24}>
          <Table<BucketItemDto>
            id="quan-ly-mau-bieu"
            rowKey="name"
            loading={isFetching}
            data={items}
            columns={[
              {
                title: "STT",
                width: 70,
                align: "center",
                fixed: "left",
                render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
              },
              {
                title: "Tên file",
                dataIndex: "name",
                ellipsis: true,
                render: (_, record) => {
                  const display = getDisplayName(record)
                  const isFolder = !record.name && Boolean(record.prefix)
                  return (
                    <Tooltip title={record.name || record.prefix}>
                      {isFolder ? (
                        <Tag color="gold">{display}</Tag>
                      ) : (
                        <span
                          className="cursor-pointer text-blue-600 hover:underline"
                          onClick={() => handleOpen(record.name)}
                        >
                          {display}
                        </span>
                      )}
                    </Tooltip>
                  )
                },
              },
              {
                title: "Kích thước",
                dataIndex: "size",
                width: 130,
                align: "right",
                render: (value) => formatBytes(value),
              },
              {
                title: "Cập nhật",
                dataIndex: "lastModified",
                width: 170,
                align: "center",
                render: (value: Date | string | undefined) =>
                  value ? dayjs(value).format(" HH:mm DD/MM/YYYY") : "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  if (!record.name) return null
                  return (
                    <Flex justify="center">
                      <Tooltip title="Tải file xuống">
                        <Button
                          type="text"
                          size="small"
                          icon={<Download size={16} />}
                          onClick={() => handleDownload(record.name)}
                        />
                      </Tooltip>
                    </Flex>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalCount,
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
              onChange: (page, size) => {
                if (size !== pageSize) {
                  setPageSize(size)
                  setCurrentPage(1)
                } else {
                  setCurrentPage(page)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

QuanLyMauBieu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
