import KhungPanel from "@components/cong-giang-vien/giang-vien/khung-panel"
import {
  type LopQuanLyRow,
  TRANG_THAI_LOP_META,
} from "@components/cong-giang-vien/giang-vien/types"
import { Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"

interface BangLopQuanLyProps {
  data: LopQuanLyRow[]
  loading?: boolean
  gon?: boolean
  onXemTatCa?: () => void
  onRowClick?: (id: string) => void
}

const columns: ColumnsType<LopQuanLyRow> = [
  {
    title: "STT",
    width: 56,
    align: "center",
    render: (_value, _record, index) => index + 1,
  },
  { title: "Mã lớp", dataIndex: "maLop", width: 110 },
  { title: "Tên lớp", dataIndex: "tenLop", ellipsis: true },
  { title: "Sĩ số", dataIndex: "siSo", width: 70, align: "center" },
  {
    title: "Trạng thái",
    dataIndex: "trangThai",
    width: 130,
    render: (value: LopQuanLyRow["trangThai"]) => {
      const meta = TRANG_THAI_LOP_META[value]
      return <Tag color={meta.color}>{meta.label}</Tag>
    },
  },
]

// Bảng "Lớp quản lý" (lớp biên chế GVCN phụ trách).
const BangLopQuanLy = ({ data, loading, gon, onXemTatCa, onRowClick }: BangLopQuanLyProps) => {
  return (
    <KhungPanel
      className={gon ? "h-full" : undefined}
      tieuDe="Lớp quản lý"
      action={
        onXemTatCa ? (
          <button
            type="button"
            onClick={onXemTatCa}
            className="cursor-pointer border-none bg-transparent p-0 text-primary hover:underline"
          >
            Xem chi tiết danh sách lớp →
          </button>
        ) : undefined
      }
      bodyClassName="p-0"
    >
      <Table<LopQuanLyRow>
        rowKey="id"
        size="small"
        tableLayout={gon ? "fixed" : undefined}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={gon ? { x: "100%", ...(data.length > 3 ? { y: 120 } : {}) } : { x: "max-content" }}
        className={gon ? "table-gv-gon [&_.ant-table]:text-xs" : undefined}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record.id),
          className: onRowClick ? "cursor-pointer" : "",
        })}
      />
    </KhungPanel>
  )
}

export default BangLopQuanLy
