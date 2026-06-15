import {
  type LopTroGiangRow,
  TRANG_THAI_TRO_GIANG_META,
} from "@components/cong-giang-vien/lop-tro-giang/types"
import { diemDanhTroGiangPath } from "@constants/cong-giang-vien-path"
import { Button, Table, Tag, Tooltip } from "antd"
import type { ColumnsType } from "antd/es/table"
import { BarChart3, ClipboardCheck, Eye } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 56

interface BangLopTroGiangProps {
  danhSach: LopTroGiangRow[]
  loading?: boolean
  trang: number
  soTrang: number
}

const BangLopTroGiang = ({ danhSach, loading, trang, soTrang }: BangLopTroGiangProps) => {
  const router = useRouter()
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

  const columns: ColumnsType<LopTroGiangRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã học phần",
      dataIndex: "maHocPhan",
      width: 130,
      ellipsis: true,
    },
    {
      title: "Tên học phần",
      dataIndex: "tenHocPhan",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Giảng viên phụ trách",
      dataIndex: "giangVienPhuTrach",
      width: 180,
      ellipsis: true,
      render: (value: string) => value || "",
    },
    {
      title: "Số sinh viên",
      dataIndex: "soSinhVien",
      width: 110,
      align: "center",
    },
    {
      title: "Số tiết TKB",
      dataIndex: "soTietTKB",
      width: 110,
      align: "center",
      render: (value: LopTroGiangRow["soTietTKB"]) => value ?? "",
    },
    {
      title: "Thời khóa biểu",
      dataIndex: "thoiKhoaBieu",
      width: 200,
      render: (value: string) =>
        value ? <span className="whitespace-pre-line">{value}</span> : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 130,
      align: "center",
      render: (value: LopTroGiangRow["trangThai"]) => {
        const meta = TRANG_THAI_TRO_GIANG_META[value]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: "Thao tác",
      width: 130,
      align: "center",
      fixed: "right",
      render: (_value, record) => (
        <div className="flex items-center justify-center gap-1">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} />}
              className="text-cgv-green-dark"
            />
          </Tooltip>
          <Tooltip title="Điểm danh">
            <Button
              type="text"
              size="small"
              icon={<ClipboardCheck size={16} />}
              onClick={() => router.push(diemDanhTroGiangPath(record.id))}
              className="text-cgv-green-dark"
            />
          </Tooltip>
          <Tooltip title="Thống kê">
            <Button
              type="text"
              size="small"
              icon={<BarChart3 size={16} />}
              className="text-cgv-green-dark"
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div
      ref={vungBangRef}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-white"
    >
      <Table<LopTroGiangRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: 1300, y: chieuCaoBody }}
        className="[&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default BangLopTroGiang
