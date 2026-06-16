import type { ThongKeDiemRenLuyen } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Card } from "antd"
import { Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeDiemRenLuyenProps {
  thongKe: ThongKeDiemRenLuyen
}

const TheDon = ({
  tieuDe,
  giaTri,
  icon,
}: {
  tieuDe: string
  giaTri: string | number
  icon: ReactNode
}) => (
  <Card size="small" className="h-full shadow-sm" styles={{ body: { padding: 14 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <span className="text-2xl font-bold leading-tight text-blue-600">{giaTri}</span>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeDiemRenLuyen = ({ thongKe }: TheThongKeDiemRenLuyenProps) => {
  const width = 840
  const height = 200
  const padding = 24
  const points = thongKe.duLieuBieuDo
  const maxY = points.length > 0 ? Math.max(...points.map((p) => p.diem), 10) : 10
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0
  const toX = (index: number) => padding + index * xStep
  const toY = (value: number) =>
    padding + ((maxY - value) / (maxY || 1)) * (height - padding * 2)

  const pathD =
    points.length > 0
      ? points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(idx)} ${toY(p.diem)}`).join(" ")
      : ""

  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thống kê</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <TheDon tieuDe="Tổng sinh viên" giaTri={thongKe.tongSinhVien} icon={<Users size={20} />} />
        <Card size="small" className="shadow-sm" styles={{ body: { padding: 14 } }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Biểu đồ điểm rèn luyện lớp
          </p>
          {points.length === 0 ? (
            <div className="flex h-[170px] items-center justify-center text-sm text-gray-400">
              Không có dữ liệu điểm để hiển thị
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="min-w-[680px]"
              >
                <line
                  x1={padding}
                  y1={height - padding}
                  x2={width - padding}
                  y2={height - padding}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
                <line
                  x1={padding}
                  y1={padding}
                  x2={padding}
                  y2={height - padding}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
                <path d={pathD} fill="none" stroke="#028850" strokeWidth="2.5" />
                {points.map((p, idx) => (
                  <circle key={p.stt} cx={toX(idx)} cy={toY(p.diem)} r="3" fill="#028850" />
                ))}
              </svg>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default TheThongKeDiemRenLuyen
