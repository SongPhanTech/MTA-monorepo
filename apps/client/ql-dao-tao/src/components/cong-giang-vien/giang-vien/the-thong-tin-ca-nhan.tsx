import type { ThongTinCaNhanTomTat } from "@components/cong-giang-vien/giang-vien/types"
import { Skeleton } from "antd"
import { BookOpen, Building2, GraduationCap, Mail, Phone, Users } from "lucide-react"
import type { ReactNode } from "react"

interface TheThongTinCaNhanProps {
  thongTin: ThongTinCaNhanTomTat
  isLoading?: boolean
}

interface HangProps {
  icon: ReactNode
  nhan: string
  giaTri?: string
}

const Hang = ({ icon, nhan, giaTri }: HangProps) => (
  <div className="flex items-center gap-2 py-0.5 text-xs leading-snug">
    <span className="flex w-4 shrink-0 items-center justify-center text-slate-400">{icon}</span>
    <span className="w-[88px] shrink-0 text-slate-500">{nhan}</span>
    <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{giaTri || "—"}</span>
  </div>
)

// Thẻ THÔNG TIN CÁ NHÂN gọn — header xanh + danh sách icon/label/value.
const TheThongTinCaNhan = ({ thongTin, isLoading }: TheThongTinCaNhanProps) => {
  const danhSach = [
    { key: "ma-gv", icon: <Users size={14} />, nhan: "Mã giảng viên", giaTri: thongTin.maGiangVien },
    { key: "khoa", icon: <Building2 size={14} />, nhan: "Khoa", giaTri: thongTin.khoa },
    { key: "bo-mon", icon: <BookOpen size={14} />, nhan: "Bộ môn", giaTri: thongTin.boMon },
    { key: "hoc-vi", icon: <GraduationCap size={14} />, nhan: "Học vị", giaTri: thongTin.hocVi },
    { key: "email", icon: <Mail size={14} />, nhan: "Email", giaTri: thongTin.email },
    { key: "phone", icon: <Phone size={14} />, nhan: "Điện thoại", giaTri: thongTin.dienThoai },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="rounded-t-lg bg-cgv-green-dark px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          Thông tin cá nhân
        </span>
      </div>

      <div className="px-3 py-2.5">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6, width: "100%" }} title={false} />
        ) : (
          <div className="flex flex-col gap-1">
            {danhSach.map((item) => (
              <Hang key={item.key} icon={item.icon} nhan={item.nhan} giaTri={item.giaTri} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TheThongTinCaNhan
