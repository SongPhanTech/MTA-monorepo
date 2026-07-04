import type {
  LocDiemRenLuyen,
  ThongKeDiemRenLuyen,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { Card } from "antd"
import { BarChart3, Trophy, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeDiemRenLuyenProps {
  thongKe: ThongKeDiemRenLuyen
  locDiem: LocDiemRenLuyen
  onChonLocDiem: (loai: Exclude<LocDiemRenLuyen, null>) => void
}

const TheDon = ({
  tieuDe,
  giaTri,
  icon,
  dangChon,
  coTheNhan,
  onClick,
}: {
  tieuDe: string
  giaTri: string | number
  icon: ReactNode
  dangChon?: boolean
  coTheNhan?: boolean
  onClick?: () => void
}) => (
  <Card
    size="small"
    className={[
      "h-full shadow-sm transition-shadow",
      coTheNhan ? "cursor-pointer hover:shadow-md" : "",
      dangChon ? "ring-2 ring-blue-500 ring-offset-1" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    styles={{ body: { padding: 14 } }}
    onClick={coTheNhan ? onClick : undefined}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-xs text-gray-500">{tieuDe}</span>
        <span className="text-2xl font-bold leading-tight text-blue-600">{giaTri}</span>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
    </div>
  </Card>
)

const TheThongKeDiemRenLuyen = ({
  thongKe,
  locDiem,
  onChonLocDiem,
}: TheThongKeDiemRenLuyenProps) => {
  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thống kê</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TheDon tieuDe="Tổng sinh viên" giaTri={thongKe.tongSinhVien} icon={<Users size={20} />} />
        <TheDon
          tieuDe="Điểm TB"
          giaTri={thongKe.diemTrungBinh != null ? thongKe.diemTrungBinh : "—"}
          icon={<BarChart3 size={20} />}
        />
        <TheDon
          tieuDe="Điểm cao nhất"
          giaTri={thongKe.diemCaoNhat != null ? thongKe.diemCaoNhat : "—"}
          icon={<Trophy size={20} />}
          coTheNhan={thongKe.diemCaoNhat != null}
          dangChon={locDiem === "cao_nhat"}
          onClick={() => onChonLocDiem("cao_nhat")}
        />
        <TheDon
          tieuDe="Điểm thấp nhất"
          giaTri={thongKe.diemThapNhat != null ? thongKe.diemThapNhat : "—"}
          icon={<Trophy size={20} />}
          coTheNhan={thongKe.diemThapNhat != null}
          dangChon={locDiem === "thap_nhat"}
          onClick={() => onChonLocDiem("thap_nhat")}
        />
      </div>
    </div>
  )
}

export default TheThongKeDiemRenLuyen
