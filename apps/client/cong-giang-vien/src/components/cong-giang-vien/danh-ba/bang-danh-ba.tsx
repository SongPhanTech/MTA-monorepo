import type { DanhBaRow, DonViDanhBa } from "@components/cong-giang-vien/danh-ba/types"
import {
  collectLecturersFromOrgIds,
  filterLecturersBySearch,
  getDescendantOrgIds,
  mapLecturerToRow,
} from "@components/cong-giang-vien/danh-ba/utils"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Input, Table, Tag } from "antd"
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

const CHIEU_CAO_DONG = 39
const CHIEU_CAO_HEADER_TABLE = 40
const CHIEU_CAO_PHAN_TRANG = 56
const CHIEU_CAO_PADDING = 16

const BangDanhBa = ({
  donViData,
  selectedOrgId,
  search,
  onSearchChange,
  loading,
  onReload,
}: BangDanhBaProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoKhungBang, setChieuCaoKhungBang] = useState(400)
  const [trangHienTai, setTrangHienTai] = useState(1)
  const [soBanGhiMoiTrang, setSoBanGhiMoiTrang] = useState(DEFAULT_PAGINATE_SIZE)

  useEffect(() => {
    setTrangHienTai(1)
  }, [selectedOrgId, search])

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => setChieuCaoKhungBang(el.clientHeight)

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedOrgId])

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

  const soDongTrangHienTai = useMemo(() => {
    if (dataSource.length === 0) return 0
    const batDau = (trangHienTai - 1) * soBanGhiMoiTrang
    return Math.min(soBanGhiMoiTrang, dataSource.length - batDau)
  }, [dataSource.length, trangHienTai, soBanGhiMoiTrang])

  const chieuCaoScrollY = useMemo(() => {
    if (soDongTrangHienTai === 0) return undefined

    const chieuCaoToiDa = Math.max(
      160,
      chieuCaoKhungBang - CHIEU_CAO_HEADER_TABLE - CHIEU_CAO_PHAN_TRANG - CHIEU_CAO_PADDING
    )
    const chieuCaoTheoDong = soDongTrangHienTai * CHIEU_CAO_DONG

    return Math.min(chieuCaoTheoDong, chieuCaoToiDa)
  }, [soDongTrangHienTai, chieuCaoKhungBang])

  const columns: ColumnsType<DanhBaRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trangHienTai - 1) * soBanGhiMoiTrang + index + 1,
    },
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
          <span className="truncate">{value}</span>
        </div>
      ),
    },
    {
      title: "Giới tính",
      dataIndex: "gioiTinh",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 180,
      ellipsis: true,
      render: (value: string) => <span>{value}</span>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "soDienThoai",
      width: 130,
      ellipsis: true,
      render: (value: string) => <span>{value}</span>,
    },
    {
      title: "Đơn vị",
      dataIndex: "donVi",
      width: 200,
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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
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
          bordered
          columns={columns}
          dataSource={dataSource}
          scroll={{ x: 1256, ...(chieuCaoScrollY ? { y: chieuCaoScrollY } : {}) }}
          pagination={{
            current: trangHienTai,
            pageSize: soBanGhiMoiTrang,
            showSizeChanger: {
              labelRender: ({ value }) => `${value} / trang`,
              optionRender: (oriOption) => `${oriOption.value} / trang`,
            },
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: (trang, kichThuocTrang) => {
              setTrangHienTai(trang)
              setSoBanGhiMoiTrang(kichThuocTrang)
            },
          }}
        />
      </div>
    </div>
  )
}

export default BangDanhBa
