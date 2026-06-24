import type { DiemRenLuyenRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 48

interface BangDiemRenLuyenProps {
  danhSach: DiemRenLuyenRow[]
  loading?: boolean
  trang: number
  soTrang: number
}

const BangDiemRenLuyen = ({ danhSach, loading, trang, soTrang }: BangDiemRenLuyenProps) => {
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

  const columns: ColumnsType<DiemRenLuyenRow> = [
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
      title: "Điểm SV đạt",
      dataIndex: "diem",
      width: 110,
      align: "center",
      render: (value: number | null) => (value != null ? value : "—"),
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      width: 140,
      ellipsis: true,
      render: (value: string) => value || "—",
    },
  ]

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pb-2">
      <Table<DiemRenLuyenRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        bordered={true}
        // className="bang-lq-chi-tiet mt-2 [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
      />
    </div>
  )
}

export default BangDiemRenLuyen
