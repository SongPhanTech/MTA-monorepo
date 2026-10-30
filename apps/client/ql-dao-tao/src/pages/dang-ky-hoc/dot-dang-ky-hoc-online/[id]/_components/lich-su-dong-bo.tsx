import {
  ClockCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
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
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  History,
  Info,
  RefreshCw,
  Server,
  User,
  XCircle,
} from "lucide-react"
import React, { useMemo, useState } from "react"

dayjs.extend(duration)

const { RangePicker } = DatePicker
const { Text } = Typography

export type LichSuDongBoProps = {
  sessionId: string
  sessionName?: string
}

type SyncRecordWithRelations = DataSyncHistory & {
  performedBy?: UserProfile | null
}

const TABLE_NAME_MAP: Record<string, string> = {
  ClassRegisterLogs: "Nhật ký đăng ký học",
  StudentSubjectScore: "Điểm môn học",
  SubjectClass: "Lớp học phần",
  SubjectClassTime: "Lịch học lớp học phần",
  ClassSchedule: "Thời khóa biểu",
  Student: "Sinh viên",
  UserProfile: "Hồ sơ người dùng",
  Lecturer: "Giảng viên",
  Staff: "Cán bộ / Nhân viên",
  FixedClass: "Lớp niên chế",
  Subject: "Môn học",
  SubjectVersion: "Phiên bản môn học",
  Curriculum: "Chương trình đào tạo",
  CurriculumVersion: "Phiên bản CTĐT",
  TrainingBlock: "Khối kiến thức",
  TrainingBlockSubject: "Môn trong khối kiến thức",
  TrainingBlockOnCurriculumVersion: "Khối theo CTĐT",
  DM_DonVi: "Đơn vị / Khoa / Viện",
  SchoolYear: "Năm học",
  Semester: "Học kỳ",
  TrainingCourse: "Khóa học",
  TrainingCourseRegulation: "Quy chế khóa học",
  TrainingMajor: "Ngành đào tạo",
  Building: "Tòa nhà",
  Room: "Phòng học",
  TrainingLocation: "Địa điểm đào tạo",
  TrainingObjectType: "Đối tượng đào tạo",
  TrainingType: "Loại hình đào tạo",
  TrainingLevel: "Trình độ đào tạo",
  TrainingForm: "Hình thức đào tạo",
  TrainingTime: "Thời gian đào tạo",
  TrainingLanguage: "Ngôn ngữ đào tạo",
  DiplomaType: "Loại văn bằng",
  AcademicRankingConvert: "Quy đổi xếp loại",
  AcademicWarningRule: "Quy tắc cảnh báo học tập",
  DisciplinaryWarningReason: "Lý do kỷ luật",
  Scholarship: "Học bổng",
  ScholarshipCriteria: "Tiêu chuẩn học bổng",
  ClassRegisterSession: "Đợt đăng ký",
  ClassRegisterSessionCredit: "Giới hạn tín chỉ",
  Exam: "Lịch thi",
  TemplateFile: "File mẫu",
}

function formatDuration(start?: string | Date | null, end?: string | Date | null): string {
  if (!start || !end) return "—"
  const s = dayjs(start)
  const e = dayjs(end)
  const diffMs = e.diff(s)
  if (diffMs < 0) return "—"

  // Chênh lệch theo giây nguyên khớp với mốc HH:mm:ss hiển thị
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

function getRecordTotalCount(record: SyncRecordWithRelations): number | null {
  const counts = (record.recordCounts as Record<string, any>) || {}
  if (counts.total !== undefined && counts.total !== null && !isNaN(Number(counts.total))) {
    return Number(counts.total)
  }
  if (counts.imported !== undefined && counts.imported !== null && !isNaN(Number(counts.imported))) {
    return Number(counts.imported)
  }
  if (counts.classRegisterLogs !== undefined) {
    return (Number(counts.classRegisterLogs) || 0) + (Number(counts.studentSubjectScore) || 0)
  }
  if (record.description) {
    const m = record.description.match(/(?:thành công|nhập|xuất|đã nhập|đã xuất)\s+(\d+)\s+bản ghi/i)
    if (m) return Number(m[1])
  }
  return null
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

function parseDescriptionBreakdown(desc?: string | null) {
  if (!desc) return { mainText: "", items: [] as Array<{ key: string; label: string; count: number }>, notes: "" }
  const match = desc.match(/^(.*?)\s*\((.*?)\)(.*)$/s)
  if (!match) {
    return { mainText: desc, items: [], notes: "" }
  }
  const mainText = match[1].trim()
  const rawItems = match[2]
  const notes = match[3].trim()

  const items: Array<{ key: string; label: string; count: number }> = []
  const parts = rawItems.split(",")
  for (const p of parts) {
    const pair = p.trim().split(":")
    if (pair.length === 2) {
      const key = pair[0].trim()
      const count = Number(pair[1].trim()) || 0
      items.push({
        key,
        label: TABLE_NAME_MAP[key] || key,
        count,
      })
    }
  }

  // Sắp xếp: số lượng nhiều lên trước
  items.sort((a, b) => b.count - a.count)

  return { mainText, items, notes }
}

export default function LichSuDongBo({ sessionId, sessionName }: LichSuDongBoProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATE_SIZE)
  const [typeFilter, setTypeFilter] = useState<DataSyncType | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<DataSyncStatus | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [detailModalRecord, setDetailModalRecord] = useState<SyncRecordWithRelations | null>(null)

  // Không annotate Prisma từ @workspace/db (prisma-client) — hooks dùng logical-prisma-client
  const where = useMemo(() => {
    const keyword = searchKeyword.trim()
    return {
      classRegisterSessionId: sessionId,
      deletedAt: null,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateRange?.[0] || dateRange?.[1]
        ? {
            createdAt: {
              ...(dateRange?.[0] ? { gte: dateRange[0].startOf("day").toDate() } : {}),
              ...(dateRange?.[1] ? { lte: dateRange[1].endOf("day").toDate() } : {}),
            },
          }
        : {}),
      ...(keyword
        ? {
            OR: [
              { fileName: { contains: keyword, mode: "insensitive" as const } },
              { sessionName: { contains: keyword, mode: "insensitive" as const } },
              { description: { contains: keyword, mode: "insensitive" as const } },
              { errorMessage: { contains: keyword, mode: "insensitive" as const } },
              {
                performedBy: {
                  OR: [
                    { fullname: { contains: keyword, mode: "insensitive" as const } },
                    { code: { contains: keyword, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    }
  }, [sessionId, typeFilter, statusFilter, dateRange, searchKeyword])

  const {
    data: syncHistories = [],
    isLoading,
    refetch,
    isFetching,
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

  const { data: allSessionHistories = [] } = useFindManyDataSyncHistory({
    where: {
      classRegisterSessionId: sessionId,
      deletedAt: null,
    },
    select: {
      type: true,
      status: true,
      createdAt: true,
    },
    take: 1000,
  })

  const stats = useMemo(() => {
    let importTotal = 0
    let importSuccess = 0
    let importFailed = 0
    let exportTotal = 0
    let exportSuccess = 0
    let exportFailed = 0

    for (const item of allSessionHistories) {
      if (item.type === DataSyncType.IMPORT) {
        importTotal += 1
        if (item.status === DataSyncStatus.SUCCESS) importSuccess += 1
        else if (item.status === DataSyncStatus.FAILED) importFailed += 1
      } else if (item.type === DataSyncType.EXPORT) {
        exportTotal += 1
        if (item.status === DataSyncStatus.SUCCESS) exportSuccess += 1
        else if (item.status === DataSyncStatus.FAILED) exportFailed += 1
      }
    }

    const latest = allSessionHistories[0]

    return {
      total: allSessionHistories.length,
      importTotal,
      importSuccess,
      importFailed,
      exportTotal,
      exportSuccess,
      exportFailed,
      lastSyncAt: latest?.createdAt ? dayjs(latest.createdAt).format("HH:mm - DD/MM/YYYY") : "—",
      lastStatus: latest?.status,
    }
  }, [allSessionHistories])

  const columns: ColumnsType<SyncRecordWithRelations> = [
    {
      title: "STT",
      width: 55,
      align: "center",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Loại thao tác",
      dataIndex: "type",
      width: 140,
      align: "center",
      render: (type: DataSyncType) => {
        if (type === DataSyncType.IMPORT) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <ArrowDownToLine size={12} />
              Nhập dữ liệu
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowUpFromLine size={12} />
            Xuất dữ liệu
          </span>
        )
      },
    },
    {
      title: "Tên file đồng bộ",
      dataIndex: "fileName",
      ellipsis: true,
      render: (_, record) => {
        const displayFileName = getDisplayFileName(record)
        if (!displayFileName) {
          return <span className="text-slate-400 text-xs italic">Không kèm file</span>
        }
        return (
          <Tooltip title={displayFileName} placement="topLeft">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <FileSpreadsheet size={15} className="text-blue-500 shrink-0" />
              <span className="truncate">{displayFileName}</span>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: "Người thực hiện",
      width: 220,
      render: (_, record) => {
        const user = record.performedBy
        if (!user) {
          return <span className="text-slate-400 text-xs italic">Hệ thống</span>
        }
        const name = user.fullname || [user.lastName, user.firstName].filter(Boolean).join(" ")
        return (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <User size={13} />
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-800 truncate" title={name}>{name || "—"}</div>
              {user.code && <div className="text-[11px] text-slate-400 font-mono">Mã: {user.code}</div>}
            </div>
          </div>
        )
      },
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "createdAt",
      width: 160,
      align: "center",
      render: (val: string) => {
        if (!val) return <span className="text-slate-400 text-xs">—</span>
        return (
          <span className="text-xs text-slate-700 font-medium">
            {dayjs(val).format("HH:mm:ss DD/MM/YYYY")}
          </span>
        )
      },
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "updatedAt",
      width: 170,
      align: "center",
      render: (val: string, record) => {
        if (!val) return <span className="text-slate-400 text-xs">—</span>
        const finish = dayjs(val).format("HH:mm:ss DD/MM/YYYY")
        const dur = formatDuration(record.createdAt, record.updatedAt)
        return (
          <div className="text-xs space-y-0.5 text-center">
            <div className="font-medium text-slate-700">{finish}</div>
            {record.status !== DataSyncStatus.PENDING && (
              <div className="text-[11px] text-indigo-600 font-medium">({dur})</div>
            )}
          </div>
        )
      },
    },
    {
      title: "Bản ghi xử lý",
      width: 130,
      align: "center",
      render: (_, record) => {
        const total = getRecordTotalCount(record)
        const counts = (record.recordCounts as Record<string, any>) || {}
        const failed = Number(counts.failed || 0)

        if (total === null || total === undefined) {
          return <span className="text-slate-400 text-xs">—</span>
        }

        return (
          <div className="text-xs text-center space-y-0.5">
            <div>
              <span className="font-bold text-slate-800 text-sm">
                {total.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] text-slate-400 ml-1">bản ghi</span>
            </div>
            {failed > 0 && (
              <div>
                <Tag color="error" className="!mr-0 text-[10px] leading-tight px-1 py-0">
                  Lỗi: {failed}
                </Tag>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (status: DataSyncStatus) => {
        if (status === DataSyncStatus.SUCCESS) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} className="text-emerald-600" />
              Thành công
            </span>
          )
        }
        if (status === DataSyncStatus.FAILED) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle size={12} className="text-rose-600" />
              Thất bại
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw size={12} className="animate-spin text-amber-600" />
            Đang xử lý
          </span>
        )
      },
    },
    {
      title: "Thao tác",
      width: 95,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          ghost
          className="!text-xs !h-7 !px-2.5 inline-flex items-center gap-1"
          icon={<EyeOutlined />}
          onClick={() => setDetailModalRecord(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  const parsedDesc = useMemo(
    () => parseDescriptionBreakdown(detailModalRecord?.description),
    [detailModalRecord?.description]
  )

  const countsDetail = (detailModalRecord?.recordCounts as Record<string, any>) || {}
  const innerDetails = countsDetail.details || {}

  const modalTotalRecords = useMemo(() => {
    if (!detailModalRecord) return 0
    if (countsDetail.total !== undefined) return Number(countsDetail.total)
    if (countsDetail.classRegisterLogs !== undefined) {
      return (Number(countsDetail.classRegisterLogs) || 0) + (Number(countsDetail.studentSubjectScore) || 0)
    }
    // Parse từ description nếu có
    const numMatch = detailModalRecord.description?.match(/thành công\s+(\d+)\s+bản ghi/i)
    if (numMatch) return Number(numMatch[1])
    return 0
  }, [detailModalRecord, countsDetail])

  return (
    <div className="space-y-4">
      {/* 4 Thẻ KPI tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng lần đồng bộ</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tất cả Import & Export</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <History size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-blue-600">Nhập dữ liệu (Import)</div>
            <div className="text-2xl font-bold text-blue-900 mt-0.5">{stats.importTotal}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Thành công: <strong className="text-emerald-600">{stats.importSuccess}</strong> • Lỗi:{" "}
              <strong className={stats.importFailed > 0 ? "text-rose-600" : "text-slate-600"}>
                {stats.importFailed}
              </strong>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ArrowDownToLine size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-600">Xuất dữ liệu (Export)</div>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5">{stats.exportTotal}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Thành công: <strong className="text-emerald-600">{stats.exportSuccess}</strong> • Lỗi:{" "}
              <strong className={stats.exportFailed > 0 ? "text-rose-600" : "text-slate-600"}>
                {stats.exportFailed}
              </strong>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowUpFromLine size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-purple-600">Lần đồng bộ gần nhất</div>
            <div className="text-xs font-semibold text-purple-900 mt-1 font-mono">{stats.lastSyncAt}</div>
            <div className="mt-1">
              {stats.lastStatus === DataSyncStatus.SUCCESS ? (
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Thành công
                </span>
              ) : stats.lastStatus === DataSyncStatus.FAILED ? (
                <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <XCircle size={11} /> Thất bại
                </span>
              ) : stats.lastStatus ? (
                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Đang xử lý
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Chưa có bản ghi</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Thanh lọc & tìm kiếm */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Row gutter={[8, 8]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} sm={8} md={6}>
                <Input
                  allowClear
                  size="small"
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Tìm tên file, người thao tác..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </Col>

              <Col xs={12} sm={8} md={5}>
                <Select
                  size="small"
                  allowClear
                  placeholder="Loại thao tác"
                  style={{ width: "100%" }}
                  value={typeFilter}
                  onChange={(val) => {
                    setTypeFilter(val)
                    setCurrentPage(1)
                  }}
                  options={[
                    { label: "Tất cả thao tác", value: undefined as any },
                    { label: "Nhập dữ liệu (Import)", value: DataSyncType.IMPORT },
                    { label: "Xuất dữ liệu (Export)", value: DataSyncType.EXPORT },
                  ]}
                />
              </Col>

              <Col xs={12} sm={8} md={5}>
                <Select
                  size="small"
                  allowClear
                  placeholder="Trạng thái"
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val)
                    setCurrentPage(1)
                  }}
                  options={[
                    { label: "Tất cả trạng thái", value: undefined as any },
                    { label: "Thành công", value: DataSyncStatus.SUCCESS },
                    { label: "Thất bại", value: DataSyncStatus.FAILED },
                    { label: "Đang xử lý", value: DataSyncStatus.PENDING },
                  ]}
                />
              </Col>

              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  size="small"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder={["Từ ngày", "Đến ngày"]}
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates as any)
                    setCurrentPage(1)
                  }}
                />
              </Col>
            </Row>
          </Col>

          <Col xs={24} md={6} className="text-right">
            <Button
              size="small"
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => void refetch()}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table<SyncRecordWithRelations>
          size="middle"
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={syncHistories}
          scroll={{ x: 1240 }}
          pagination={{
            size: "small",
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} lần đồng bộ`,
            onChange: (page, pSize) => {
              setCurrentPage(page)
              setPageSize(pSize)
            },
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-slate-400 text-xs">
                <History size={36} className="mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <div>Chưa có lịch sử đồng bộ dữ liệu cho đợt đăng ký này</div>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal chi tiết lần đồng bộ - Thiết kế mới chuyên nghiệp, thoáng đãng */}
      <Modal
        title={
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <History size={18} />
              </div>
              <div>
                <div className="text-base font-bold text-slate-800">Chi tiết lịch sử đồng bộ</div>
                <div className="text-xs text-slate-400 font-normal">
                  Đợt: {detailModalRecord?.sessionName || sessionName || "Đợt đăng ký học"}
                </div>
              </div>
            </div>

            {detailModalRecord && (
              <div>
                {detailModalRecord.status === DataSyncStatus.SUCCESS ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Thành công
                  </span>
                ) : detailModalRecord.status === DataSyncStatus.FAILED ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle size={13} className="text-rose-600" />
                    Thất bại
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <RefreshCw size={13} className="animate-spin text-amber-600" />
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
            {/* Nếu thất bại, cảnh báo lỗi nổi bật */}
            {detailModalRecord.status === DataSyncStatus.FAILED && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <div className="flex items-center gap-2 font-semibold text-rose-900 mb-1">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>Nguyên nhân đồng bộ thất bại</span>
                </div>
                <div className="text-xs font-mono bg-white/70 p-2.5 rounded-lg border border-rose-200 text-rose-700 whitespace-pre-wrap">
                  {detailModalRecord.errorMessage || "Không có thông tin chi tiết lỗi."}
                </div>
              </div>
            )}

            {/* Khung thông tin cơ bản: Layout Grid rõ ràng */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3.5">
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Loại thao tác
                  </div>
                  <div className="mt-1">
                    {detailModalRecord.type === DataSyncType.IMPORT ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        <ArrowDownToLine size={12} />
                        Nhập dữ liệu (Import từ Portal)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                        <ArrowUpFromLine size={12} />
                        Xuất dữ liệu (Export ra Portal)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Người thực hiện
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span>
                      {detailModalRecord.performedBy?.fullname ||
                        [
                          detailModalRecord.performedBy?.lastName,
                          detailModalRecord.performedBy?.firstName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        "Hệ thống"}
                    </span>
                    {detailModalRecord.performedBy?.code && (
                      <span className="font-mono text-slate-400 font-normal">
                        ({detailModalRecord.performedBy.code})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Thời lượng xử lý
                  </div>
                  <div className="mt-1 font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-500" />
                    {formatDuration(detailModalRecord.createdAt, detailModalRecord.updatedAt)}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Tên file đồng bộ
                  </div>
                  {(() => {
                    const modalFileName = getDisplayFileName(detailModalRecord)
                    return (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-xs text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <FileSpreadsheet size={15} className="text-blue-600 shrink-0" />
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

                {detailModalRecord.fileVersion && (
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Phiên bản cấu trúc
                    </div>
                    <div className="mt-1 font-mono text-xs font-semibold text-slate-700">
                      {detailModalRecord.fileVersion}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Khung Mốc thời gian & Đối chiếu: Giúp phân biệt rõ ràng các thời điểm */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                <Calendar size={15} className="text-indigo-600" />
                <span>Các mốc thời gian xử lý dữ liệu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-medium text-slate-500">Bắt đầu đồng bộ</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                    {detailModalRecord.createdAt
                      ? dayjs(detailModalRecord.createdAt).format("HH:mm:ss — DD/MM/YYYY")
                      : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tiếp nhận gói tin tại backend</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-medium text-slate-500">Hoàn thành đồng bộ</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                    {detailModalRecord.updatedAt
                      ? dayjs(detailModalRecord.updatedAt).format("HH:mm:ss — DD/MM/YYYY")
                      : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Đã ghi nhận toàn bộ vào CSDL</div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200">
                  <div className="text-[11px] font-medium text-indigo-700">Mốc Portal xuất gói tin</div>
                  <div className="text-xs font-bold text-indigo-900 mt-1 font-mono">
                    {detailModalRecord.sourceExportedAt
                      ? dayjs(detailModalRecord.sourceExportedAt).format("HH:mm:ss — DD/MM/YYYY")
                      : "—"}
                  </div>
                  <div className="text-[10px] text-indigo-600/80 mt-0.5">
                    Thời điểm dữ liệu lấy từ cổng SV
                  </div>
                </div>
              </div>

              <div className="mt-2.5 p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý đối chiếu:</strong> Thời gian sinh viên đăng ký được ghi nhận trực tiếp trên từng đơn tại tab <em>Danh sách đơn đăng ký</em> (cột <strong>Thời gian đăng ký</strong>), phân biệt hoàn toàn với thời điểm dữ liệu được đóng gói từ Portal và thời điểm import vào phần mềm nội bộ (cột <strong>Thời gian import</strong>).
                </span>
              </div>
            </div>

            {/* Khung Thống kê số lượng bản ghi: Thay thế đoạn text dài dằng dặc bằng các thẻ số liệu */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database size={15} className="text-blue-600" />
                  <span>Số lượng bản ghi đã xử lý</span>
                </div>
                {modalTotalRecords > 0 && (
                  <span className="text-xs text-slate-500">
                    Tổng cộng: <strong className="text-slate-800 text-sm">{modalTotalRecords.toLocaleString("vi-VN")}</strong> bản ghi
                  </span>
                )}
              </div>

              {/* Nếu có parsed items từ description hoặc details */}
              {parsedDesc.items.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {parsedDesc.mainText || "Đã đồng bộ thành công dữ liệu."}
                    {parsedDesc.notes && <div className="text-amber-700 mt-1">{parsedDesc.notes}</div>}
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Chi tiết theo từng danh mục / bảng dữ liệu:
                  </div>

                  <div className="max-h-[220px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {parsedDesc.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-slate-700 font-medium truncate mr-2" title={`${item.label} (${item.key})`}>
                            {item.label}
                          </span>
                          <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs shrink-0">
                            {item.count.toLocaleString("vi-VN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : innerDetails.classRegisterLogs !== undefined ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-center">
                    <div className="text-[11px] text-blue-700 font-medium">Nhật ký đăng ký</div>
                    <div className="text-lg font-bold text-blue-900 mt-0.5">
                      {innerDetails.classRegisterLogs ?? 0}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-center">
                    <div className="text-[11px] text-emerald-700 font-medium">Điểm môn học</div>
                    <div className="text-lg font-bold text-emerald-900 mt-0.5">
                      {innerDetails.studentSubjectScore ?? 0}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-center">
                    <div className="text-[11px] text-amber-700 font-medium">Đã ẩn (soft-delete)</div>
                    <div className="text-lg font-bold text-amber-900 mt-0.5">
                      {(innerDetails.removedLogs ?? 0) + (innerDetails.removedScores ?? 0)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-medium">Bản ghi lỗi / bỏ qua</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {countsDetail.failed ?? 0}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {detailModalRecord.description || "Đồng bộ thành công dữ liệu."}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
