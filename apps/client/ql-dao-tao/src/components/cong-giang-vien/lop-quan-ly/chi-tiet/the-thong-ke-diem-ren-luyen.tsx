import type { ThongKeDiemRenLuyen } from "@components/cong-giang-vien/lop-quan-ly/types"
import { Card } from "antd"
import { BarChart3, Trophy, UserCheck, Users } from "lucide-react"
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
  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thống kê</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TheDon tieuDe="Tổng sinh viên" giaTri={thongKe.tongSinhVien} icon={<Users size={20} />} />
        <TheDon tieuDe="Sinh viên có điểm" giaTri={thongKe.soSinhVienCoDiem} icon={<UserCheck size={20} />} />
        <TheDon
          tieuDe="Điểm trung bình"
          giaTri={thongKe.diemTrungBinh != null ? thongKe.diemTrungBinh : "—"}
          icon={<BarChart3 size={20} />}
        />
        <TheDon
          tieuDe="Điểm cao nhất"
          giaTri={thongKe.diemCaoNhat != null ? thongKe.diemCaoNhat : "—"}
          icon={<Trophy size={20} />}
        />
        <TheDon
          tieuDe="Điểm thấp nhất"
          giaTri={thongKe.diemThapNhat != null ? thongKe.diemThapNhat : "—"}
          icon={<Trophy size={20} />}
        />
      </div>
    </div>
  )
}

export default TheThongKeDiemRenLuyen
