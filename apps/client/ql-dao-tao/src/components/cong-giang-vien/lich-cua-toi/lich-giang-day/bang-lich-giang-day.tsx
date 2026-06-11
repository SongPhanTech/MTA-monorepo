import type {
  DongLichBangTheoNgayGiangDay,
  DongLichGiangDay,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import type { CheDoHienThiLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { Button, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Filter, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface BangLichGiangDayProps {
  cheDoHienThi: CheDoHienThiLich
  danhSach: DongLichGiangDay[]
  danhSachBangTheoNgay: DongLichBangTheoNgayGiangDay[]
  ngayHomNayKey?: string
  tuKhoa: string
  dangTai?: boolean
  onDoiTuKhoa: (value: string) => void
}

const CHIEU_CAO_HEADER_BANG = 39

const cotChiTiet: ColumnsType<DongLichGiangDay> = [
  {
    title: "Học phần",
    dataIndex: "hocPhan",
    key: "hocPhan",
    ellipsis: true,
  },
  {
    title: "Lớp học phần",
    dataIndex: "lopHocPhan",
    key: "lopHocPhan",
    width: 120,
    ellipsis: true,
  },
  {
    title: "Khu vực",
    dataIndex: "khuVuc",
    key: "khuVuc",
    width: 130,
    ellipsis: true,
  },
  {
    title: "Phòng học",
    dataIndex: "phongHoc",
    key: "phongHoc",
    width: 100,
    ellipsis: true,
  },
  {
    title: "Ghi chú",
    dataIndex: "ghiChu",
    key: "ghiChu",
    width: 140,
    ellipsis: true,
  },
]

const BangLichGiangDay = ({
  cheDoHienThi,
  danhSach,
  danhSachBangTheoNgay,
  ngayHomNayKey,
  tuKhoa,
  dangTai,
  onDoiTuKhoa,
}: BangLichGiangDayProps) => {
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

  useEffect(() => {
    if (cheDoHienThi !== "thang" || !ngayHomNayKey) return
    const hangHomNay = vungBangRef.current?.querySelector(".lich-gd-hom-nay")
    hangHomNay?.scrollIntoView({ block: "nearest" })
  }, [cheDoHienThi, danhSachBangTheoNgay, ngayHomNayKey])

  const cotCoBan: ColumnsType<DongLichGiangDay> = [
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 120,
      render: (_, row) => `${row.thoiGianBatDau} - ${row.thoiGianKetThuc}`,
    },
    ...cotChiTiet,
  ]

  const cotNgayRowspan: ColumnsType<DongLichBangTheoNgayGiangDay> = [
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
      width: 100,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
    },
  ]

  const cotTuan: ColumnsType<DongLichBangTheoNgayGiangDay> = [
    ...cotNgayRowspan,
    ...(cotCoBan as ColumnsType<DongLichBangTheoNgayGiangDay>),
  ]

  const cotThang: ColumnsType<DongLichBangTheoNgayGiangDay> = [
    ...cotNgayRowspan,
    ...(cotChiTiet as ColumnsType<DongLichBangTheoNgayGiangDay>),
  ]

  const emptyText =
    cheDoHienThi === "thang"
      ? "Không có lịch giảng dạy trong tháng"
      : cheDoHienThi === "tuan"
        ? "Không có lịch giảng dạy trong tuần"
        : "Không có lịch giảng dạy trong ngày"

  const placeholderTimKiem =
    cheDoHienThi === "thang"
      ? "Tìm theo học phần, lớp học phần, phòng học, khu vực..."
      : "Tìm theo học phần, lớp học phần, phòng học..."

  const onRowTheoNgay = (record: DongLichBangTheoNgayGiangDay) => ({
    className:
      cheDoHienThi === "thang" &&
      ngayHomNayKey &&
      record.ngayKey === ngayHomNayKey &&
      record.rowSpanNgay > 0
        ? "lich-gd-hom-nay"
        : undefined,
  })

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Input
          value={tuKhoa}
          onChange={(e) => onDoiTuKhoa(e.target.value)}
          placeholder={placeholderTimKiem}
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          className="flex-1"
        />
        <Button type="default" icon={<Filter size={16} />} aria-label="Bộ lọc" />
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
        {cheDoHienThi === "thang" ? (
          <Table<DongLichBangTheoNgayGiangDay>
            rowKey="id"
            columns={cotThang}
            dataSource={danhSachBangTheoNgay}
            loading={dangTai}
            pagination={false}
            size="small"
            onRow={onRowTheoNgay}
            scroll={{ x: 908, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600"
            locale={{ emptyText }}
          />
        ) : cheDoHienThi === "tuan" ? (
          <Table<DongLichBangTheoNgayGiangDay>
            rowKey="id"
            columns={cotTuan}
            dataSource={danhSachBangTheoNgay}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 948, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600"
            locale={{ emptyText }}
          />
        ) : (
          <Table<DongLichGiangDay>
            rowKey="id"
            columns={cotCoBan}
            dataSource={danhSach}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 908, y: chieuCaoBody }}
            className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600"
            locale={{ emptyText }}
          />
        )}
      </div>
    </div>
  )
}

export default BangLichGiangDay
