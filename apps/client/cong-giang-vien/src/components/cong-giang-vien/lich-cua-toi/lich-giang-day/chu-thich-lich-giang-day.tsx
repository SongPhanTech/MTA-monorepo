import { LOAI_LICH_META } from "@components/cong-giang-vien/giang-vien/types"
import type { PeriodType } from "@workspace/db"

interface ChuThichLichGiangDayProps {
  loaiTiet: PeriodType[]
}

const MAU_THEO_LOAI: Record<PeriodType, string> = {
  THEORY: "#2563eb",
  CHECK: "#16a34a",
  WEEK: "#ea580c",
  EXAM: "#dc2626",
  PRACTICE: "#d97706",
  LAB: "#9333ea",
  SEMINAR: "#0891b2",
  MAKEUP: "#6b7280",
  REVIEW: "#ea580c",
}

const ChuThichLichGiangDay = ({ loaiTiet }: ChuThichLichGiangDayProps) => {
  if (loaiTiet.length === 0) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" aria-hidden />
        Giảng dạy
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600">
      {loaiTiet.map((loai) => (
        <span key={loai} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: MAU_THEO_LOAI[loai] }}
            aria-hidden
          />
          {LOAI_LICH_META[loai].label}
        </span>
      ))}
    </div>
  )
}

export default ChuThichLichGiangDay
