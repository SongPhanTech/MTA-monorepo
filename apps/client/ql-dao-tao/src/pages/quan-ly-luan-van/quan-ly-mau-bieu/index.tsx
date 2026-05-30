import { SearchOutlined, UploadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { generatePresignedUrl, deleteObject, presignedGetObject, useListObjects } from "@workspace/libs/api/model"
import type { BucketItemDto } from "@workspace/libs/api/schemas"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { Button, Col, Flex, Input, message, Popconfirm, Row, Tag, Tooltip, Upload } from "antd"
import axios from "axios"
import dayjs from "dayjs"
import _ from "lodash"
import { Download, Eye, RefreshCcw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type SortField = "name" | "size" | "lastModified"
type SortOrder = "asc" | "desc"

const LUAN_VAN_PREFIX = "luan-van/"
const LUAN_VAN_PATH = "luan-van"
/** Lấy toàn bộ object trong prefix; phân trang chỉ ở FE (số lượng mẫu biểu nhỏ). */
const LIST_ALL_OBJECTS_LIMIT = 10_000
const MAX_UPLOAD_SIZE_MB = 50
// const ACCEPT_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.jpg,.jpeg,.png,.xlsx, "

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

const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || ""

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
  const [searchInput, setSearchInput] = useState("")
  const [searchText, setSearchText] = useState("")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null)
  const [deletingObjectName, setDeletingObjectName] = useState<string | null>(null)

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const debouncedSetSearch = useCallback(
    _.debounce((value: string) => {
      setSearchText(value)
      setCurrentPage(1)
    }, 300),
    []
  )

  useEffect(() => {
    return () => debouncedSetSearch.cancel()
  }, [debouncedSetSearch])

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

  const filteredItems = useMemo(() => {
    const keyword = normalizeVietnamese(searchText.trim())
    if (!keyword) return allItems
    return allItems.filter((item) =>
      normalizeVietnamese(getDisplayName(item)).includes(keyword)
    )
  }, [allItems, searchText])

  const sortedItems = useMemo(() => {
    if (!sortField || !sortOrder) return filteredItems
    const sorted = [...filteredItems]
    sorted.sort((a, b) => {
      let compare = 0
      if (sortField === "name") {
        compare = getDisplayName(a).localeCompare(getDisplayName(b), "vi")
      } else if (sortField === "size") {
        compare = (a.size ?? 0) - (b.size ?? 0)
      } else if (sortField === "lastModified") {
        const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0
        const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0
        compare = aTime - bTime
      }
      return sortOrder === "asc" ? compare : -compare
    })
    return sorted
  }, [filteredItems, sortField, sortOrder])

  const totalCount = sortedItems.length
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1)

  useEffect(() => {
    if (currentPage > maxPage) setCurrentPage(maxPage)
  }, [currentPage, maxPage])

  const items = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  const getColumnSortOrder = (field: SortField) => {
    if (sortField !== field || !sortOrder) return null
    return sortOrder === "asc" ? "ascend" : "descend"
  }

  const handleReload = () => {
    setCurrentPage(1)
    refetch()
  }

  const handlePreview = async (objectName?: string) => {
    if (!objectName) return
    const displayName = stripPrefix(objectName) || objectName
    try {
      showSpinner()
      const res = await presignedGetObject({ objectName })
      onOpenPreview({
        uri: res.data.url,
        name: displayName,
        mimeType: getFileExtension(displayName),
      })
    } catch (error) {
      console.error(error)
      message.error("Không thể xem trước file. Vui lòng thử lại.")
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

  const handleDelete = async (objectName?: string) => {
    if (!objectName) return
    try {
      setDeletingObjectName(objectName)
      showSpinner()
      const res = await deleteObject({ objectName })
      if (res.status !== 200) {
        throw new Error(`HTTP ${res.status}`)
      }
      message.success(`Đã xóa "${stripPrefix(objectName)}".`)
      await refetch()
    } catch (error) {
      console.error(error)
      message.error("Không thể xóa file. Vui lòng thử lại.")
    } finally {
      setDeletingObjectName(null)
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
          <h2 className="text-base font-semibold m-0">
            Quản lý mẫu biểu/tài liệu phòng sau đại học
          </h2>
        </Col>

        <Col span={24}>
          <Flex justify="space-between" align="center" gap={16}>
            <Input
              placeholder="Tìm kiếm theo tên file"
              prefix={<SearchOutlined />}
              allowClear
              value={searchInput}
              className="max-w-sm"
              onChange={(e) => {
                const value = e.target.value
                setSearchInput(value)
                debouncedSetSearch(value)
              }}
              onClear={() => {
                setSearchInput("")
                debouncedSetSearch.cancel()
                setSearchText("")
                setCurrentPage(1)
              }}
            />
            <Flex gap={8} className="shrink-0">
              <Upload
                multiple
                // accept={ACCEPT_EXTENSIONS}
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
            onChange={(_, __, sorterInfo) => {
              const sorter = Array.isArray(sorterInfo) ? sorterInfo[0] : sorterInfo
              const field = (sorter?.field ?? sorter?.columnKey) as SortField | undefined
              if (
                !sorter?.order ||
                !field ||
                !["name", "size", "lastModified"].includes(field)
              ) {
                setSortField(null)
                setSortOrder(null)
                return
              }
              setSortField(field)
              setSortOrder(sorter.order === "ascend" ? "asc" : "desc")
              setCurrentPage(1)
            }}
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
                key: "name",
                ellipsis: true,
                sorter: true,
                sortOrder: getColumnSortOrder("name"),
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
                          onClick={() => handlePreview(record.name)}
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
                key: "size",
                width: 130,
                align: "right",
                sorter: true,
                sortOrder: getColumnSortOrder("size"),
                render: (value) => formatBytes(value),
              },
              {
                title: "Cập nhật",
                dataIndex: "lastModified",
                key: "lastModified",
                width: 170,
                align: "center",
                sorter: true,
                sortOrder: getColumnSortOrder("lastModified"),
                render: (value: Date | string | undefined) =>
                  value ? dayjs(value).format(" HH:mm DD/MM/YYYY") : "",
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  if (!record.name) return null
                  return (
                    <Flex justify="center" gap={4}>
                      <Tooltip title="Xem trước">
                        <Button
                          type="text"
                          size="small"
                          icon={<Eye size={16} />}
                          onClick={() => handlePreview(record.name)}
                        />
                      </Tooltip>
                      <Tooltip title="Tải file xuống">
                        <Button
                          type="text"
                          size="small"
                          icon={<Download size={16} />}
                          onClick={() => handleDownload(record.name)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title={`Xóa file "${getDisplayName(record)}"?`}
                        description="Hành động này không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{
                          danger: true,
                          loading: deletingObjectName === record.name,
                        }}
                        onConfirm={() => handleDelete(record.name)}
                      >
                        <Tooltip title="Xóa file">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<Trash2 size={16} />}
                            loading={deletingObjectName === record.name}
                          />
                        </Tooltip>
                      </Popconfirm>
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
