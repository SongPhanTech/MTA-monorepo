import KhungPanel from "@components/cong-giang-vien/giang-vien/khung-panel"
import type { LopQuanLyRow } from "@components/cong-giang-vien/giang-vien/types"
import { useFixedClassTypeOptions } from "@hooks/fixedClassType"
import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { type CSSProperties, useEffect, useRef, useState } from "react"

// Chiều cao header (thead) của bảng, dùng để tính chiều cao thân bảng cuộn.
const CHIEU_CAO_HEADER_BANG = 39
// Số bản ghi tối đa hiển thị ở dạng xem nhanh (gon) trên trang chủ.
const SO_BAN_GHI_TOI_DA = 10

interface BangLopQuanLyProps {
  data: LopQuanLyRow[]
  loading?: boolean
  gon?: boolean
  onXemTatCa?: () => void
  onRowClick?: (id: string) => void
}

const BangLopQuanLy = ({ data, loading, gon, onXemTatCa, onRowClick }: BangLopQuanLyProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(120)
  const { getFixedClassTypeLabel } = useFixedClassTypeOptions()

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
      title: "Loại lớp",
      dataIndex: "classType",
      width: 140,
      render: (value: LopQuanLyRow["classType"]) => getFixedClassTypeLabel(value),
    },
  ]

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
      <div
        ref={vungBangRef}
        className="h-full min-h-0 overflow-hidden"
        style={gon ? ({ "--gv-body-h": `${chieuCaoBody}px` } as CSSProperties) : undefined}
      >
        <Table<LopQuanLyRow>
          rowKey="id"
          size="small"
          tableLayout={gon ? "fixed" : undefined}
          columns={columns}
          dataSource={data.slice(0, SO_BAN_GHI_TOI_DA)}
          loading={loading}
          pagination={false}
          scroll={gon ? { x: "100%", y: chieuCaoBody } : { x: "max-content" }}
          className={gon ? "bang-gv-full [&_.ant-table]:text-xs" : undefined}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record.id),
            className: onRowClick ? "cursor-pointer" : "",
          })}
        />
      </div>
    </KhungPanel>
  )
}

export default BangLopQuanLy
