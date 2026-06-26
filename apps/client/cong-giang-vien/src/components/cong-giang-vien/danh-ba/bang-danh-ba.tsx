import type { DanhBaRow, DonViDanhBa } from "@components/cong-giang-vien/danh-ba/types"
import {
  collectLecturersFromOrgIds,
  filterLecturersBySearch,
  getDescendantOrgIds,
  getInitials,
  mapLecturerToRow,
} from "@components/cong-giang-vien/danh-ba/utils"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Avatar, Button, Input, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { RefreshCw, Users } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

interface BangDanhBaProps {
  donViData: DonViDanhBa[]
  selectedOrgId: string | null
  search: string
  onSearchChange: (value: string) => void
  loading?: boolean
  onReload: () => void
}

const CHIEU_CAO_HEADER_BANG = 96

const BangDanhBa = ({
  donViData,
  selectedOrgId,
  search,
  onSearchChange,
  loading,
  onReload,
}: BangDanhBaProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const lecturers = useMemo(() => {
    if (!selectedOrgId) return []

    const orgIds = getDescendantOrgIds(donViData, selectedOrgId)
    const collected = collectLecturersFromOrgIds(donViData, orgIds)
    return filterLecturersBySearch(collected, search)
  }, [donViData, selectedOrgId, search])

  const dataSource = useMemo(
    () => lecturers.map((lecturer, index) => mapLecturerToRow(lecturer, index)),
    [lecturers]
  )

  const selectedOrgName = useMemo(() => {
    if (!selectedOrgId) return ""
    return donViData.find((item) => item.Id === selectedOrgId)?.sTen || ""
  }, [donViData, selectedOrgId])

  const columns: ColumnsType<DanhBaRow> = [
    {
      title: "Mã cán bộ",
      dataIndex: "maCanBo",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Họ tên",
      dataIndex: "hoTen",
      width: 220,
      ellipsis: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Avatar size={28} className="shrink-0 bg-cgv-green/20 text-xs text-cgv-green-dark">
            {getInitials(value)}
          </Avatar>
          <span className="truncate">{value}</span>
        </div>
      ),
    },
    {
      title: "Học hàm",
      dataIndex: "hocHam",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 200,
      ellipsis: true,
      render: (value: string) => (
        <span className="text-red-600">{value}</span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "soDienThoai",
      width: 130,
      ellipsis: true,
      render: (value: string) => (
        <span className="text-red-600">{value}</span>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "donVi",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Vị trí việc làm",
      dataIndex: "viTriViecLam",
      width: 160,
      ellipsis: true,
    },
  ]

  if (!selectedOrgId) {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cgv-green/10">
          <Users className="h-10 w-10 text-cgv-green-dark" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Chọn đơn vị</h3>
        <p className="max-w-md text-center text-sm text-gray-500">
          Vui lòng chọn một đơn vị từ cây dữ liệu bên trái để xem danh bạ cán bộ
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-gray-800">{selectedOrgName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            allowClear
            placeholder="Tìm theo: Mã cán bộ, Họ tên..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-72"
          />
          <Button icon={<RefreshCw className="h-4 w-4" />} onClick={onReload}>
            Tải lại
          </Button>
          <Tag color="green">Tổng số: {dataSource.length}</Tag>
        </div>
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden p-2">
        <Table<DanhBaRow>
          rowKey="key"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={dataSource}
          scroll={{ x: 1100, y: chieuCaoBody }}
          pagination={{
            pageSize: DEFAULT_PAGINATE_SIZE,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
        />
      </div>
    </div>
  )
}

export default BangDanhBa
