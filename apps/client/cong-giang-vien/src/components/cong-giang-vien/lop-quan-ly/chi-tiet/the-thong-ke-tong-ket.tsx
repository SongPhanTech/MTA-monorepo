import type { ThongKeTongKet } from "@components/cong-giang-vien/lop-quan-ly/types"
import { dinhDangGpa, mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Card } from "antd"
import { BarChart3, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongKeTongKetProps {
  thongKe: ThongKeTongKet
}

const MAU_THE: Record<string, { bg: string; text: string }> = {
  green: { bg: "bg-green-50", text: "text-green-600" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  gold: { bg: "bg-amber-50", text: "text-amber-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-500" },
  red: { bg: "bg-red-50", text: "text-red-500" },
  default: { bg: "bg-gray-50", text: "text-gray-600" },
}

const TheDon = ({
  tieuDe,
  giaTri,
  phuDe,
  icon,
  mau = "default",
}: {
  tieuDe: string
  giaTri: string | number
  phuDe?: string
  icon: ReactNode
  mau?: string
}) => {
  const style = MAU_THE[mau] ?? MAU_THE.default

  return (
    <Card size="small" className="h-full shadow-sm" styles={{ body: { padding: "14px 16px" } }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-xs leading-snug text-gray-500">{tieuDe}</span>
          <span className={`text-2xl font-bold leading-none ${style.text}`}>{giaTri}</span>
          {phuDe ? (
            <span className="text-xs leading-snug text-gray-400">{phuDe}</span>
          ) : (
            <span className="invisible text-xs leading-snug">—</span>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

const TheThongKeTongKet = ({ thongKe }: TheThongKeTongKetProps) => {
  return (
    <div className="shrink-0 px-4 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thống kê</p>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <TheDon
            tieuDe="Tổng sinh viên"
            giaTri={thongKe.tongSinhVien}
            icon={<Users size={20} />}
          />
          <TheDon
            tieuDe="Điểm TB cả lớp"
            giaTri={dinhDangGpa(thongKe.diemTrungBinh)}
            phuDe={`Hệ ${thongKe.heDiem}`}
            icon={<BarChart3 size={20} />}
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
                icon={<Users size={20} />}
                mau={mauXepLoaiHocLuc(item.ten)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TheThongKeTongKet
