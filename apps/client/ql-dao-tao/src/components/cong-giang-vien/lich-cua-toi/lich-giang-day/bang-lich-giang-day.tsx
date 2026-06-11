import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import { Button, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Filter, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface BangLichGiangDayProps {
  danhSach: DongLichGiangDay[]
  tuKhoa: string
  dangTai?: boolean
  onDoiTuKhoa: (value: string) => void
}

const CHIEU_CAO_HEADER_BANG = 39

const BangLichGiangDay = ({ danhSach, tuKhoa, dangTai, onDoiTuKhoa }: BangLichGiangDayProps) => {
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

  const cot: ColumnsType<DongLichGiangDay> = [
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 130,
      render: (_, row) => `${row.thoiGianBatDau} - ${row.thoiGianKetThuc}`,
    },
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
      width: 130,
      ellipsis: true,
    },
    {
      title: "Khu vực",
      dataIndex: "khuVuc",
      key: "khuVuc",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Phòng học",
      dataIndex: "phongHoc",
      key: "phongHoc",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      key: "ghiChu",
      width: 160,
      ellipsis: true,
    },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Input
          value={tuKhoa}
          onChange={(e) => onDoiTuKhoa(e.target.value)}
          placeholder="Tìm theo học phần, lớp học phần, phòng học, khu vực..."
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          className="flex-1"
        />
        <Button type="default" icon={<Filter size={16} />} aria-label="Bộ lọc" />
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
        <Table<DongLichGiangDay>
          rowKey="id"
          columns={cot}
          dataSource={danhSach}
          loading={dangTai}
          pagination={false}
          size="small"
          scroll={{ x: 900, y: chieuCaoBody }}
          className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600"
          locale={{ emptyText: "Không có lịch giảng dạy trong ngày" }}
        />
      </div>
    </div>
  )
}

export default BangLichGiangDay
