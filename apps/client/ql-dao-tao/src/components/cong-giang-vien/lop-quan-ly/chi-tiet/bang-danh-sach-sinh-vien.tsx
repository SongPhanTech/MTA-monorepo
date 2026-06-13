import type { SinhVienLopQuanLyRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Button, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { BarChart3, Eye } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 48

interface BangDanhSachSinhVienProps {
  danhSach: SinhVienLopQuanLyRow[]
  loading?: boolean
  trang: number
  soTrang: number
  layNhanTrangThai: (status: SinhVienLopQuanLyRow["trangThai"]) => {
    label: string
    color: string
  }
  onXemHoSo: (id: string) => void
  onXemKetQuaHocTap: (id: string) => void
}

const BangDanhSachSinhVien = ({
  danhSach,
  loading,
  trang,
  soTrang,
  layNhanTrangThai,
  onXemHoSo,
  onXemKetQuaHocTap,
}: BangDanhSachSinhVienProps) => {
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

  const columns: ColumnsType<SinhVienLopQuanLyRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "MSSV",
      dataIndex: "maSinhVien",
      width: 120,
      align: "center",
    },
    {
      title: "Họ và tên",
      dataIndex: "hoVaTen",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Giới tính",
      dataIndex: "gioiTinh",
      width: 90,
      align: "center",
    },
    {
      title: "Ngày sinh",
      dataIndex: "ngaySinh",
      width: 110,
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "lienHe",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 130,
      align: "center",
      render: (value: SinhVienLopQuanLyRow["trangThai"]) => {
        const meta = layNhanTrangThai(value)
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: "Thao tác",
      width: 200,
      align: "center",
      fixed: "right",
      render: (_value, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="small"
            icon={<Eye size={14} />}
            onClick={() => onXemHoSo(record.id)}
            className="inline-flex items-center gap-1 border-cgv-green-dark text-cgv-green-dark"
          >
            Hồ sơ
          </Button>
          <Button
            size="small"
            icon={<BarChart3 size={14} />}
            onClick={() => onXemKetQuaHocTap(record.id)}
            className="inline-flex items-center gap-1 border-cgv-green-dark text-cgv-green-dark"
          >
            KQ học tập
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div ref={vungBangRef} className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-2">
      <Table<SinhVienLopQuanLyRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: 1100, y: chieuCaoBody }}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        className="h-full [&_.ant-spin-nested-loading]:h-full [&_.ant-spin-container]:h-full [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default BangDanhSachSinhVien
