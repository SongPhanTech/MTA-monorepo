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
  visible?: boolean
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
  visible = true,
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
    const raf = requestAnimationFrame(capNhatChieuCao)
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    window.addEventListener("resize", capNhatChieuCao)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("resize", capNhatChieuCao)
    }
  }, [danhSach.length, loading, visible])

  const columns: ColumnsType<SinhVienLopQuanLyRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
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
      render: (_value, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="small"
            icon={<Eye size={14} className="block" />}
            onClick={() => onXemHoSo(record.id)}
            className="inline-flex items-center justify-center gap-1 border-cgv-green-dark leading-none text-cgv-green-dark [&_.ant-btn-icon]:flex [&_.ant-btn-icon]:items-center"
          >
            Hồ sơ
          </Button>
          <Button
            size="small"
            icon={<BarChart3 size={14} className="block" />}
            onClick={() => onXemKetQuaHocTap(record.id)}
            className="inline-flex items-center justify-center gap-1 border-cgv-green-dark leading-none text-cgv-green-dark [&_.ant-btn-icon]:flex [&_.ant-btn-icon]:items-center"
          >
            KQ học tập
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pb-2">
      <Table<SinhVienLopQuanLyRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ y: chieuCaoBody }}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        className="bang-lq-chi-tiet mt-2 [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
      />
    </div>
  )
}

export default BangDanhSachSinhVien
