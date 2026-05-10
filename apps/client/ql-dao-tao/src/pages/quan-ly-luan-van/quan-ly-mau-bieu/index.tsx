import Table from "@components/commons/table"
import ViewIcon from "@components/icons/view"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { presignedGetObject, useListObjects } from "@workspace/libs/api/model"
import type { BucketItemDto } from "@workspace/libs/api/schemas"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { RefreshCcw } from "lucide-react"
import { useMemo, useState } from "react"

const LUAN_VAN_PREFIX = "luan-van/"

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
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])

  const { showSpinner, hideSpinner } = useSpinner()

  const startAfter = cursorStack[cursorStack.length - 1]

  const queryParams = useMemo(
    () => ({
      path: LUAN_VAN_PREFIX,
      limit: pageSize,
      ...(startAfter ? { startAfter } : {}),
    }),
    [pageSize, startAfter]
  )

  const { data, isFetching, refetch } = useListObjects(queryParams, {
    query: {
      placeholderData: (prev) => prev,
    },
  })

  const items = useMemo(
    () =>
      normalizeBucketItems(data?.data).map((item) => ({
        ...item,
        name: item.name || item.prefix || "",
      })),
    [data]
  )
  const hasNext = items.length === pageSize
  const estimatedTotal = (currentPage - 1) * pageSize + items.length + (hasNext ? 1 : 0)

  const goToPage = (nextPage: number, nextSize: number) => {
    if (nextSize !== pageSize) {
      setPageSize(nextSize)
      setCursorStack([undefined])
      setCurrentPage(1)
      return
    }

    if (nextPage === currentPage) return

    if (nextPage === currentPage + 1) {
      const last = items[items.length - 1]
      const lastName = last?.name || last?.prefix
      if (!lastName) return
      setCursorStack((prev) => [...prev, lastName])
      setCurrentPage(nextPage)
      return
    }

    if (nextPage === currentPage - 1) {
      setCursorStack((prev) => prev.slice(0, -1))
      setCurrentPage(nextPage)
      return
    }

    if (nextPage === 1) {
      setCursorStack([undefined])
      setCurrentPage(1)
    }
  }

  const handleReload = () => {
    setCursorStack([undefined])
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

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <h2 className="text-base font-semibold m-0">
              Mẫu biểu / Tài liệu trong <Tag color="blue">mta/{LUAN_VAN_PREFIX}</Tag>
            </h2>
            <Button icon={<RefreshCcw size={14} />} onClick={handleReload} loading={isFetching}>
              Tải lại
            </Button>
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
                  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "",
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
                      <ViewIcon title="Xem / Tải file" onClick={() => handleOpen(record.name)} />
                    </Flex>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize,
              total: estimatedTotal,
              showTotal: (_total, range) =>
                hasNext
                  ? `${range[0]} - ${range[1]} (còn nữa)`
                  : `${range[0]} - ${range[1]} trong tổng số ${(currentPage - 1) * pageSize + items.length} bản ghi`,
              onChange: (page, size) => goToPage(page, size),
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
