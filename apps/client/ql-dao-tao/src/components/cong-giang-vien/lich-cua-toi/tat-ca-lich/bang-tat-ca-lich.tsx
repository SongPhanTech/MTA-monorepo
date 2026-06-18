import type { CheDoHienThiLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import type {
  DongBangTatCaLich,
  DongBangThangTatCaLich,
  DongTatCaLich,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import { Button, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Filter, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface BangTatCaLichProps {
  cheDoHienThi: CheDoHienThiLich
  danhSach: DongTatCaLich[]
  danhSachBangTuan: DongBangTatCaLich[]
  danhSachBangThang: DongBangThangTatCaLich[]
  tuKhoa: string
  dangTai?: boolean
  onDoiTuKhoa: (value: string) => void
}

const CHIEU_CAO_HEADER_BANG = 39

const renderLoaiLich = (row: DongTatCaLich) => (
  <span
    className="inline-block rounded border px-2 py-0.5 text-xs font-medium"
    style={{
      borderColor: row.mauLoai,
      color: row.mauLoai,
      backgroundColor: `${row.mauLoai}14`,
    }}
  >
    {row.tenLoai}
  </span>
)

const BangTatCaLich = ({
  cheDoHienThi,
  danhSach,
  danhSachBangTuan,
  danhSachBangThang,
  tuKhoa,
  dangTai,
  onDoiTuKhoa,
}: BangTatCaLichProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(240)

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(120, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cotChiTiet: ColumnsType<DongTatCaLich> = [
    {
      title: "Thời gian",
      dataIndex: "thoiGian",
      key: "thoiGian",
      width: 130,
    },
    {
      title: "Nội dung",
      key: "noiDung",
      ellipsis: true,
      render: (_, row) =>
        cheDoHienThi === "ngay" ? (
          row.noiDung
        ) : (
          <span className="font-semibold">{row.tieuDeHienThi}</span>
        ),
    },
    {
      title: "Loại lịch",
      key: "loaiLich",
      width: 120,
      render: (_, row) => renderLoaiLich(row),
    },
    {
      title: "Địa điểm",
      dataIndex: "diaDiem",
      key: "diaDiem",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      key: "ghiChu",
      width: 200,
      ellipsis: true,
    },
  ]

  const cotTuan: ColumnsType<DongBangTatCaLich> = [
    {
      title: "Thứ",
      dataIndex: "thu",
      key: "thu",
      width: 72,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanThu }),
    },
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 72,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
    },
    ...(cotChiTiet as ColumnsType<DongBangTatCaLich>),
  ]

  const cotThang: ColumnsType<DongBangThangTatCaLich> = [
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 110,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
    },
    {
      title: "Thứ",
      dataIndex: "thu",
      key: "thu",
      width: 72,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanThu }),
    },
    ...(cotChiTiet as ColumnsType<DongBangThangTatCaLich>),
  ]

  const emptyText =
    cheDoHienThi === "thang"
      ? "Không có lịch trong tháng"
      : cheDoHienThi === "tuan"
        ? "Không có lịch trong tuần"
        : "Không có lịch trong ngày"

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Input
          value={tuKhoa}
          onChange={(e) => onDoiTuKhoa(e.target.value)}
          placeholder="Tìm theo nội dung lịch"
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          className="flex-1"
        />
        <Button type="default" icon={<Filter size={16} />} aria-label="Bộ lọc" />
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
        {cheDoHienThi === "thang" ? (
          <Table<DongBangThangTatCaLich>
            rowKey="id"
            columns={cotThang}
            dataSource={danhSachBangThang}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 1020, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
          />
        ) : cheDoHienThi === "tuan" ? (
          <Table<DongBangTatCaLich>
            rowKey="id"
            columns={cotTuan}
            dataSource={danhSachBangTuan}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 980, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
          />
        ) : (
          <Table<DongTatCaLich>
            rowKey="id"
            columns={cotChiTiet}
            dataSource={danhSach}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 860, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
          />
        )}
      </div>
    </div>
  )
}

export default BangTatCaLich
