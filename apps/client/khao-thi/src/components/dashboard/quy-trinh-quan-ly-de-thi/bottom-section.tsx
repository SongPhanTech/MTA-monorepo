import { CalendarRange, BookOpen, GraduationCap, User, Users, ArrowDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { QuyTrinhDeThiView } from "./type"

interface BottomSectionProps {
  view?: QuyTrinhDeThiView
}

interface BottomLink {
  label: string
  icon: LucideIcon
  path?: string
}

const inputLinks: BottomLink[] = [
  { label: "Năm học,\nhọc kỳ", icon: CalendarRange },
  { label: "Môn học", icon: BookOpen },
  { label: "Chương trình\nđào tạo", icon: GraduationCap },
  { label: "Lớp học phần", icon: User },
  { label: "Danh sách học viên\nđủ điều kiện dự thi", icon: Users },
]

export function BottomSection({ view = "main" }: BottomSectionProps) {
  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg p-4 border border-[#e8eaed] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px] uppercase tracking-[0.04em]">
        <ArrowDown className="h-4 w-4" />
        <span>ĐẦU VÀO</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-5 gap-2 sm:gap-3">
        {inputLinks.map((card, idx) => {
          const IconComp = card.icon
          return (
            <div
              key={idx}
              className="group bottom-card p-1.5 flex flex-col items-center justify-start rounded-lg transition duration-300 relative cursor-default hover:bg-[#f0fdf4]/50"
            >
              {idx < inputLinks.length - 1 && (
                <div className="absolute right-[-4px] top-2 bottom-2 w-[1px] bg-[#e5e7eb] hidden lg:block" />
              )}
              <div className="bottom-icon-container w-10 h-10 lg:w-11 lg:h-11 mb-2 flex items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105">
                <IconComp className="bottom-icon w-5 h-5" />
              </div>
              <span className="bottom-label text-[11px] lg:text-[12px] font-bold text-[#374151] group-hover:text-[#0f8a4b] transition text-center px-1 whitespace-pre-line leading-tight">
                {card.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
