import type { LopQuanLyChiTietRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { useFixedClassTypeOptions } from "@hooks/fixedClassType"
import { Button, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Eye } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 80

interface BangDanhSachLopQuanLyProps {
  danhSach: LopQuanLyChiTietRow[]
  loading?: boolean
  trang: number
  soTrang: number
  onXemChiTiet: (id: string) => void
}

const BangDanhSachLopQuanLy = ({
  danhSach,
  loading,
  trang,
  soTrang,
  onXemChiTiet,
}: BangDanhSachLopQuanLyProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)
  const { getFixedClassTypeLabel } = useFixedClassTypeOptions()

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

  const columns: ColumnsType<LopQuanLyChiTietRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã lớp",
      dataIndex: "maLop",
      width: 80,
      ellipsis: true,
    },
    {
      title: "Tên lớp",
      dataIndex: "tenLop",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Đơn vị quản lý",
      dataIndex: "donViQuanLy",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Sĩ số",
      align: "center",
      children: [
        {
          title: "Nam",
          dataIndex: "siSoNam",
          width: 64,
          align: "center",
        },
        {
          title: "Nữ",
          dataIndex: "siSoNu",
          width: 64,
          align: "center",
        },
        {
          title: "Tổng",
          dataIndex: "siSoTong",
          width: 64,
          align: "center",
        },
      ],
    },
    {
      title: "Học kỳ",
      dataIndex: "hocKy",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Năm học",
      dataIndex: "namHoc",
      width: 110,
      align: "center",
    },
    {
      title: "Loại lớp",
      dataIndex: "classType",
      width: 140,
      render: (value: LopQuanLyChiTietRow["classType"]) => getFixedClassTypeLabel(value),
    },
    {
      title: "Thao tác",
      width: 90,
      align: "center",
      fixed: "right",
      render: (_value, record) => (
        <Button type="link" size="small" onClick={() => onXemChiTiet(record.id)}>
          <Eye size={14} className="text-cgv-green-dark" />
          <span className="text-cgv-green-dark">Xem</span>
        </Button>
      ),
    },
  ]

  return (
    <div
      ref={vungBangRef}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-white"
    >
      <Table<LopQuanLyChiTietRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: 1200, y: chieuCaoBody }}
        bordered={true}
        // className="[&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
      />
    </div>
  )
}

export default BangDanhSachLopQuanLy
