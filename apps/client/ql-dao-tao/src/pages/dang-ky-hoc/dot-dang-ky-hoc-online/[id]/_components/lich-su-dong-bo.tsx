import { CopyOutlined } from "@ant-design/icons"
import Table, { type ColumnsType } from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { getTableDisplayName, isDatabaseTable } from "@constants/table-names"
import type { FilterProps } from "@constants/type"
import {
  DataSyncStatus,
  DataSyncType,
  type DataSyncHistory,
  type UserProfile,
} from "@workspace/db"
import {
  useCountDataSyncHistory,
  useFindManyDataSyncHistory,
} from "@workspace/db/hooks"
import {
  Button,
  Modal,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import React, { useMemo, useState } from "react"

dayjs.extend(duration)

const { Text } = Typography

export type LichSuDongBoProps = {
  sessionId: string
  sessionName?: string
}

type SyncRecordWithRelations = DataSyncHistory & {
  performedBy?: UserProfile | null
}

function formatDuration(start?: string | Date | null, end?: string | Date | null): string {
  if (!start || !end) return "—"
  const s = dayjs(start)
  const e = dayjs(end)
  const diffMs = e.diff(s)
  if (diffMs < 0) return "—"

  const secDiff = e.unix() - s.unix()
  const durationSeconds = Math.max(secDiff, Math.round(diffMs / 1000))

  if (durationSeconds < 1) {
    return diffMs > 0 ? "1 giây" : "< 1 giây"
  }
  if (durationSeconds < 60) {
    return `${durationSeconds} giây`
  }
  const minutes = Math.floor(durationSeconds / 60)
  const remSec = durationSeconds % 60
  return `${minutes} phút ${remSec > 0 ? `${remSec}s` : ""}`
}

function getDisplayFileName(record: {
  fileName?: string | null
  type: DataSyncType
  createdAt: string | Date
  sessionName?: string | null
}): string | null {
  if (record.fileName) return record.fileName
  if (record.type === DataSyncType.EXPORT) {
    const stamp = dayjs(record.createdAt).format("YYYYMMDD-HHmm")
    const safeName =
      (record.sessionName || "dot")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "dot"
    return `export-dot-dang-ky-${safeName}-${stamp}.dat`
  }
  return null
}

function getCategoryTableNames(record?: SyncRecordWithRelations | null): string[] {
  if (!record) return []

  const names: string[] = []
  const addName = (rawKey: string) => {
    const label = getTableDisplayName(rawKey)
    if (label && !names.includes(label)) {
      names.push(label)
    }
  }

  const recordCounts = (record.recordCounts as Record<string, any>) || {}

  // 1. Ưu tiên hàng đầu: Metadata categories do backend trả về trực tiếp
  if (Array.isArray(recordCounts.categories) && recordCounts.categories.length > 0) {
    const list: string[] = []
    for (const item of recordCounts.categories) {
      const label =
        typeof item === "string"
          ? item
          : item?.label || item?.name || item?.displayName || item?.key
      if (label && typeof label === "string" && !list.includes(label.trim())) {
        list.push(label.trim())
      }
    }
    if (list.length > 0) return list
  }

  // 1. Duyệt qua details (kết quả đồng bộ đăng ký): tự động nhận diện bảng CSDL hợp lệ
  if (recordCounts.details && typeof recordCounts.details === "object") {
    for (const key of Object.keys(recordCounts.details)) {
      if (isDatabaseTable(key)) {
        addName(key)
      }
    }
    if (names.length > 0) return names
  }

  // 2. Duyệt qua counts (đồng bộ danh mục / cấu trúc hệ thống)
  if (recordCounts.counts && typeof recordCounts.counts === "object") {
    for (const key of Object.keys(recordCounts.counts)) {
      if (isDatabaseTable(key)) {
        addName(key)
      }
    }
    if (names.length > 0) return names
  }

  // 3. Nếu recordCounts trực tiếp chứa danh sách bảng
  for (const key of Object.keys(recordCounts)) {
    if (isDatabaseTable(key)) {
      addName(key)
    }
  }
  if (names.length > 0) return names

  // 4. Dự phòng: Đọc danh sách bảng từ chuỗi mô tả description do backend tạo: "Đã xuất thành công ... (TrainingField: 120, ...)"
  if (record.description) {
    const firstParen = record.description.indexOf("(")
    const lastParen = record.description.lastIndexOf(")")
    if (firstParen !== -1 && lastParen > firstParen) {
      const innerContent = record.description.substring(firstParen + 1, lastParen)
      const parts = innerContent.split(",")
      for (const p of parts) {
        const pair = p.trim().split(":")
        if (pair.length >= 1 && pair[0].trim()) {
          const candidate = pair[0].trim()
          if (isDatabaseTable(candidate)) {
            addName(candidate)
          }
        }
      }
    }
  }

  return names
}

export default function LichSuDongBo({ sessionId, sessionName }: LichSuDongBoProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    performedBy: undefined,
    type: undefined,
    status: undefined,
    createdAt: undefined,
  } as any)
  const [detailModalRecord, setDetailModalRecord] = useState<SyncRecordWithRelations | null>(null)

  const where = useMemo(() => {
    const rawType = (filters as any)?.type
    const rawStatus = (filters as any)?.status
    const rawCreatedAt = (filters as any)?.createdAt
    const rawPerformedBy =
      typeof (filters as any)?.performedBy === "string"
        ? (filters as any).performedBy.trim()
        : ""

    const typeList = Array.isArray(rawType) ? rawType : rawType ? [rawType] : []
    const statusList = Array.isArray(rawStatus) ? rawStatus : rawStatus ? [rawStatus] : []

    let createdAtWhere: any = undefined
    if (
      Array.isArray(rawCreatedAt) &&
      rawCreatedAt.length === 2 &&
      (rawCreatedAt[0] || rawCreatedAt[1])
    ) {
      createdAtWhere = {
        ...(rawCreatedAt[0]
          ? { gte: dayjs(rawCreatedAt[0], "DD/MM/YYYY").startOf("day").toDate() }
          : {}),
        ...(rawCreatedAt[1]
          ? { lte: dayjs(rawCreatedAt[1], "DD/MM/YYYY").endOf("day").toDate() }
          : {}),
      }
    }

    let performedByWhere: any = undefined
    if (rawPerformedBy) {
      const isSystemMatch =
        "hệ thống".includes(rawPerformedBy.toLowerCase()) ||
        "he thong".includes(rawPerformedBy.toLowerCase())

      const userConditions = [
        { fullname: { contains: rawPerformedBy, mode: "insensitive" as const } },
        { code: { contains: rawPerformedBy, mode: "insensitive" as const } },
        { firstName: { contains: rawPerformedBy, mode: "insensitive" as const } },
        { lastName: { contains: rawPerformedBy, mode: "insensitive" as const } },
      ]

      if (isSystemMatch) {
        performedByWhere = {
          OR: [
            { performedById: null },
            { performedBy: { OR: userConditions } },
          ],
        }
      } else {
        performedByWhere = {
          performedBy: {
            OR: userConditions,
          },
        }
      }
    }

    return {
      classRegisterSessionId: sessionId,
      deletedAt: null,
      ...(typeList.length > 0 ? { type: { in: typeList } } : {}),
      ...(statusList.length > 0 ? { status: { in: statusList } } : {}),
      ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
      ...(performedByWhere ? performedByWhere : {}),
    }
  }, [sessionId, filters])

  const {
    data: syncHistories = [],
    isLoading,
  } = useFindManyDataSyncHistory({
    where,
    include: {
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
  })

  const { data: totalCount = 0 } = useCountDataSyncHistory({
    where,
  })

  const columns: ColumnsType<SyncRecordWithRelations> = [
    {
      title: "STT",
      width: 50,
      align: "center",
      className: "!py-1.5 !px-2",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Người thực hiện",
      dataIndex: "performedBy",
      width: 220,
      type: "input",
      className: "!py-1.5 !px-2",
      render: (_, record) => {
        const user = record.performedBy
        if (!user) {
          return <span className="text-slate-400 italic">Hệ thống</span>
        }
        const name = user.fullname || [user.lastName, user.firstName].filter(Boolean).join(" ")
        return [name, user.code].filter(Boolean).join(" - ") || "—"
      },
    },
    {
      title: "Loại thao tác",
      dataIndex: "type",
      width: 140,
      align: "center",
      type: "select",
      className: "!py-1.5 !px-2",
      options: [
        { label: "Nhập dữ liệu", value: DataSyncType.IMPORT },
        { label: "Xuất dữ liệu", value: DataSyncType.EXPORT },
      ],
      render: (type: DataSyncType) => {
        if (type === DataSyncType.IMPORT) {
          return <Tag color="blue">Nhập dữ liệu</Tag>
        }
        return <Tag color="green">Xuất dữ liệu</Tag>
      },
    },
    {
      title: "Tên file đồng bộ",
      dataIndex: "fileName",
      ellipsis: true,
      className: "!py-1.5 !px-2",
      render: (_, record) => {
        const displayFileName = getDisplayFileName(record)
        return (
          <Tooltip title="Nhấp để xem chi tiết" placement="topLeft">
            <span
              onClick={() => setDetailModalRecord(record)}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate block"
            >
              {displayFileName || "Không kèm file"}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "createdAt",
      width: 170,
      align: "center",
      type: "date",
      className: "!py-1.5 !px-2",
      render: (val: string) => (val ? dayjs(val).format("HH:mm:ss DD/MM/YYYY") : "—"),
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "updatedAt",
      width: 160,
      align: "center",
      className: "!py-1.5 !px-2",
      render: (val: string) => (val ? dayjs(val).format("HH:mm:ss DD/MM/YYYY") : "—"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      type: "select",
      className: "!py-1.5 !px-2",
      options: [
        { label: "Thành công", value: DataSyncStatus.SUCCESS },
        { label: "Thất bại", value: DataSyncStatus.FAILED },
        { label: "Đang xử lý", value: DataSyncStatus.PENDING },
      ],
      render: (status: DataSyncStatus) => {
        if (status === DataSyncStatus.SUCCESS) {
          return <Tag color="success">Thành công</Tag>
        }
        if (status === DataSyncStatus.FAILED) {
          return <Tag color="error">Thất bại</Tag>
        }
        return <Tag color="warning">Đang xử lý</Tag>
      },
    },
  ]

  const categoryTableNames = useMemo(
    () => getCategoryTableNames(detailModalRecord),
    [detailModalRecord]
  )

  return (
    <div className="space-y-4">
      {/* Bảng dữ liệu tích hợp bộ lọc chuẩn hệ thống */}
      <Table
        rowKey="id"
        className="!mt-0"
        loading={isLoading}
        filters={filters}
        setFilters={(val) => {
          setFilters(val)
          setCurrentPage(1)
        }}
        columns={columns as any}
        data={syncHistories}
        pagination={{
          size: "small",
          current: currentPage,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pSize) => {
            setCurrentPage(page)
            setPageSize(pSize)
          },
        }}
      />

      {/* Modal chi tiết lần đồng bộ */}
      <Modal
        title={
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 pr-6">
            <div>
              <div className="text-base font-bold text-slate-800">Chi tiết lịch sử đồng bộ</div>
              {detailModalRecord && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {detailModalRecord.type === DataSyncType.IMPORT ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Nhập dữ liệu
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                      Xuất dữ liệu
                    </span>
                  )}
                  {(sessionName || detailModalRecord.sessionName) && (
                    <span className="text-xs text-slate-400 font-normal">
                      • Đợt: {sessionName || detailModalRecord.sessionName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {detailModalRecord && (
              <div className="shrink-0">
                {detailModalRecord.status === DataSyncStatus.SUCCESS ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Thành công
                  </span>
                ) : detailModalRecord.status === DataSyncStatus.FAILED ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Thất bại
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Đang xử lý
                  </span>
                )}
              </div>
            )}
          </div>
        }
        open={!!detailModalRecord}
        onCancel={() => setDetailModalRecord(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalRecord(null)} className="!px-6">
            Đóng
          </Button>,
        ]}
        width={820}
        destroyOnClose
      >
        {detailModalRecord && (
          <div className="py-2 space-y-4 text-xs">
            {detailModalRecord.status === DataSyncStatus.FAILED && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <div className="font-semibold text-rose-900 mb-1">
                  Nguyên nhân đồng bộ thất bại
                </div>
                <div className="bg-white/70 p-2.5 rounded-lg border border-rose-200 text-rose-700 whitespace-pre-wrap">
                  {detailModalRecord.errorMessage || "Không có thông tin chi tiết lỗi."}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
              <div>
                <div className="text-slate-500 font-medium">
                  Người thực hiện
                </div>
                <div className="mt-1 font-semibold text-slate-800">
                  {[
                    detailModalRecord.performedBy?.fullname ||
                      [
                        detailModalRecord.performedBy?.lastName,
                        detailModalRecord.performedBy?.firstName,
                      ]
                        .filter(Boolean)
                        .join(" "),
                    detailModalRecord.performedBy?.code,
                  ]
                    .filter(Boolean)
                    .join(" - ") || "Hệ thống"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Tên file đồng bộ</span>
                  {detailModalRecord.fileVersion && (
                    <span className="text-slate-400 font-normal">
                      phiên bản: {detailModalRecord.fileVersion}
                    </span>
                  )}
                </div>
                {(() => {
                  const modalFileName = getDisplayFileName(detailModalRecord)
                  return (
                    <div className="mt-1 flex items-center justify-between gap-1.5 text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="truncate flex-1 font-semibold">
                        {modalFileName || "—"}
                      </span>
                      {modalFileName && (
                        <Tooltip title="Sao chép tên file">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(modalFileName)
                              message.success("Đã chép tên file")
                            }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="text-slate-500 font-medium">
                    Thời lượng xử lý
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {formatDuration(detailModalRecord.createdAt, detailModalRecord.updatedAt)}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium">
                    Bắt đầu đồng bộ
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {detailModalRecord.createdAt
                      ? dayjs(detailModalRecord.createdAt).format("HH:mm:ss — DD/MM/YYYY")
                      : "—"}
                  </div>
                  <div className="text-slate-400 mt-0.5">Tiếp nhận gói tin tại backend</div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium">
                    Hoàn thành đồng bộ
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {detailModalRecord.updatedAt
                      ? dayjs(detailModalRecord.updatedAt).format("HH:mm:ss — DD/MM/YYYY")
                      : "—"}
                  </div>
                  <div className="text-slate-400 mt-0.5">Đã ghi nhận toàn bộ vào CSDL</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-700 mb-3">
                Chi tiết theo từng danh mục / bảng dữ liệu:
              </div>

              {categoryTableNames.length > 0 ? (
                <div className="max-h-[260px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryTableNames.map((tableName, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-slate-700 font-medium text-xs truncate"
                        title={tableName}
                      >
                        {tableName}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Không có chi tiết danh mục bảng dữ liệu.
                </div>
              )}
            </div>
          </div>
        )}      </Modal>
    </div>
  )
}
