import type {
  LocXepLoaiTongKet,
  ThongKeTongKet,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { dinhDangGpa, mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Card } from "antd"
import { BarChart3, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeTongKetProps {
  thongKe: ThongKeTongKet
  locXepLoai: LocXepLoaiTongKet
  onChonLocXepLoai: (ten: string) => void
}

const MAU_THE: Record<
  string,
  {
    card: string
    text: string
    phuDe: string
    iconBg: string
    iconText: string
  }
> = {
  violet: {
    card: "bg-gradient-to-br from-violet-50 via-white to-violet-100/60",
    text: "text-violet-700",
    phuDe: "text-violet-500/80",
    iconBg: "bg-violet-500 shadow-md shadow-violet-200",
    iconText: "text-white",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-50 via-white to-sky-100/70",
    text: "text-blue-700",
    phuDe: "text-blue-500/80",
    iconBg: "bg-blue-500 shadow-md shadow-blue-200",
    iconText: "text-white",
  },
  green: {
    card: "bg-gradient-to-br from-green-50 via-white to-emerald-100/70",
    text: "text-emerald-700",
    phuDe: "text-emerald-600/80",
    iconBg: "bg-emerald-500 shadow-md shadow-emerald-200",
    iconText: "text-white",
  },
  cyan: {
    card: "bg-gradient-to-br from-cyan-50 via-white to-teal-100/70",
    text: "text-cyan-700",
    phuDe: "text-cyan-600/80",
    iconBg: "bg-cyan-500 shadow-md shadow-cyan-200",
    iconText: "text-white",
  },
  gold: {
    card: "bg-gradient-to-br from-amber-50 via-white to-yellow-100/70",
    text: "text-amber-700",
    phuDe: "text-amber-600/80",
    iconBg: "bg-amber-500 shadow-md shadow-amber-200",
    iconText: "text-white",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 via-white to-orange-100/70",
    text: "text-orange-700",
    phuDe: "text-orange-600/80",
    iconBg: "bg-orange-500 shadow-md shadow-orange-200",
    iconText: "text-white",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 via-white to-rose-100/70",
    text: "text-red-700",
    phuDe: "text-red-600/80",
    iconBg: "bg-red-500 shadow-md shadow-red-200",
    iconText: "text-white",
  },
  default: {
    card: "bg-gradient-to-br from-slate-50 via-white to-slate-100/70",
    text: "text-slate-700",
    phuDe: "text-slate-500/80",
    iconBg: "bg-slate-500 shadow-md shadow-slate-200",
    iconText: "text-white",
  },
}

const TheDon = ({
  tieuDe,
  giaTri,
  phuDe,
  icon,
  mau = "default",
  dangChon,
  coTheNhan,
  onClick,
}: {
  tieuDe: string
  giaTri: string | number
  phuDe?: string
  icon: ReactNode
  mau?: string
  dangChon?: boolean
  coTheNhan?: boolean
  onClick?: () => void
}) => {
  const style = MAU_THE[mau] ?? MAU_THE.default

  return (
    <Card
      size="small"
      className={[
        "h-full overflow-hidden border border-gray-100/80 shadow-sm transition-shadow",
        coTheNhan ? "cursor-pointer hover:shadow-md" : "",
        dangChon ? "ring-2 ring-blue-500 ring-offset-1" : "",
        style.card,
      ]
        .filter(Boolean)
        .join(" ")}
      styles={{ body: { padding: "14px 16px" } }}
      onClick={coTheNhan ? onClick : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-xs font-medium leading-snug text-gray-600">{tieuDe}</span>
          <span className={`text-2xl font-extrabold leading-none tracking-tight ${style.text}`}>
            {giaTri}
          </span>
          {phuDe ? (
            <span className={`text-xs font-semibold leading-snug ${style.phuDe}`}>{phuDe}</span>
          ) : (
            <span className="invisible text-xs leading-snug">—</span>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconText}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

const TheThongKeTongKet = ({ thongKe, locXepLoai, onChonLocXepLoai }: TheThongKeTongKetProps) => {
  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Thống kê</p>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <TheDon
            tieuDe="Tổng sinh viên"
            giaTri={thongKe.tongSinhVien}
            icon={<Users size={20} strokeWidth={2.25} />}
            mau="violet"
          />
          <TheDon
            tieuDe="Điểm TB cả lớp"
            giaTri={dinhDangGpa(thongKe.diemTrungBinh)}
            phuDe={`Hệ ${thongKe.heDiem}`}
            icon={<BarChart3 size={20} strokeWidth={2.25} />}
            mau="blue"
          />
        </div>

        {thongKe.theoXepLoai.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {thongKe.theoXepLoai.map((item) => (
              <TheDon
                key={item.ten}
                tieuDe={item.ten}
                giaTri={item.soSinhVien}
                phuDe={item.tyLe}
                icon={<Users size={20} strokeWidth={2.25} />}
                mau={mauXepLoaiHocLuc(item.ten)}
                coTheNhan={item.soSinhVien > 0}
                dangChon={locXepLoai === item.ten}
                onClick={() => onChonLocXepLoai(item.ten)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TheThongKeTongKet
