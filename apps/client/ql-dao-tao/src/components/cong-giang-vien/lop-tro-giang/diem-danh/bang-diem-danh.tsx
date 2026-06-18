import type {
  SinhVienDiemDanhRow,
  TrangThaiDiemDanh,
} from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"
import { Checkbox, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 56

interface BangDiemDanhProps {
  danhSach: SinhVienDiemDanhRow[]
  loading?: boolean
  onDoiTrangThai: (studentId: string, trangThai: TrangThaiDiemDanh) => void
  onDoiGhiChu: (studentId: string, ghiChu: string) => void
}

const BangDiemDanh = ({ danhSach, loading, onDoiTrangThai, onDoiGhiChu }: BangDiemDanhProps) => {
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

  const oCheckbox = (record: SinhVienDiemDanhRow, trangThai: TrangThaiDiemDanh) => (
    <Checkbox
      checked={record.trangThai === trangThai}
      onChange={() => onDoiTrangThai(record.studentId, trangThai)}
    />
  )

  const columns: ColumnsType<SinhVienDiemDanhRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "MSSV",
      dataIndex: "maSinhVien",
      width: 120,
      align: "center",
    },
    {
      title: "Họ tên",
      dataIndex: "hoTen",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Có mặt",
      width: 110,
      align: "center",
      render: (_value, record) => oCheckbox(record, "PRESENT"),
    },
    {
      title: "Vắng có phép",
      width: 130,
      align: "center",
      render: (_value, record) => oCheckbox(record, "EXCUSED_ABSENT"),
    },
    {
      title: "Vắng không phép",
      width: 140,
      align: "center",
      render: (_value, record) => oCheckbox(record, "UNEXCUSED_ABSENT"),
    },
    {
      title: "Ghi chú",
      width: 240,
      render: (_value, record) => (
        <Input
          placeholder="Nhập ghi chú..."
          value={record.ghiChu}
          onChange={(e) => onDoiGhiChu(record.studentId, e.target.value)}
        />
      ),
    },
  ]

  return (
    <div
      ref={vungBangRef}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-white"
    >
      <Table<SinhVienDiemDanhRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: 1000, y: chieuCaoBody }}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        className="[&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
      />
    </div>
  )
}

export default BangDiemDanh
