import type { TongKetRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { dinhDangGpa, mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Button, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Eye } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 48

interface BangTongKetProps {
  danhSach: TongKetRow[]
  loading?: boolean
  trang: number
  soTrang: number
  onXemChiTiet: (id: string) => void
}

const BangTongKet = ({ danhSach, loading, trang, soTrang, onXemChiTiet }: BangTongKetProps) => {
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
    window.addEventListener("resize", capNhatChieuCao)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", capNhatChieuCao)
    }
  }, [danhSach.length, loading])

  const columns: ColumnsType<TongKetRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã sinh viên",
      dataIndex: "maSinhVien",
      width: 130,
      align: "center",
    },
    {
      title: "Họ và tên",
      dataIndex: "hoVaTen",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Điểm tối đa",
      dataIndex: "diemToiDa",
      width: 110,
      align: "center",
    },
    {
      title: "Điểm SV đạt",
      dataIndex: "diem",
      width: 110,
      align: "center",
      render: (value: number | null) => dinhDangGpa(value),
    },
    {
      title: "Xếp loại",
      dataIndex: "xepLoai",
      width: 150,
      align: "center",
      render: (value: string | null) =>
        value ? <Tag color={mauXepLoaiHocLuc(value)}>{value}</Tag> : "—",
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      width: 140,
      ellipsis: true,
      render: (value: string) => value || "—",
    },
    {
      title: "Chi tiết",
      width: 90,
      align: "center",
      render: (_value, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          className="inline-flex items-center gap-1 px-0 text-cgv-green-dark"
          onClick={() => onXemChiTiet(record.id)}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pb-2">
      <Table<TongKetRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        className="bang-lq-chi-tiet mt-2 [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400 [&_.ant-table-thead>tr>th:first-child]:!rounded-tl-none [&_.ant-table-thead>tr>th:last-child]:!rounded-tr-none"
      />
    </div>
  )
}

export default BangTongKet
