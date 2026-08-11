import {
  ArrowDown,
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  FolderOpen,
  MessageSquare,
  ScrollText,
} from "lucide-react"

const links = [
  { label: "CHƯƠNG TRÌNH\nĐÀO TẠO", icon: BookOpen },
  { label: "QUY ĐỊNH, HƯỚNG DẪN\nTỰ ĐÁNH GIÁ", icon: ScrollText },
  { label: "BỘ TIÊU CHUẨN,\nTIÊU CHÍ", icon: ClipboardList },
  { label: "MINH CHỨNG,\nDỮ LIỆU HIỆN CÓ", icon: FolderOpen },
  { label: "DỮ LIỆU THỐNG KÊ,\nKHẢO SÁT", icon: Database },
  { label: "PHẢN HỒI TỪ CÁC\nBÊN LIÊN QUAN", icon: MessageSquare },
  { label: "KẾ HOẠCH\nTỰ ĐÁNH GIÁ", icon: FileText },
]

export function BottomSection() {
  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg p-4 border border-[#e8eaed] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px] uppercase tracking-[0.04em]">
        <ArrowDown className="h-4 w-4" />
        <span>ĐẦU VÀO</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {links.map((card, idx) => {
          const IconComp = card.icon
          return (
            <div
              key={idx}
              className="group bottom-card p-2 flex flex-col items-center justify-center rounded-lg transition duration-300 relative cursor-default"
            >
              {idx < links.length - 1 && (
                <div className="absolute right-[-8px] top-0 bottom-0 w-[1px] bg-[#e5e7eb] hidden lg:block" />
              )}
              <div className="bottom-icon-container w-11 h-11 mb-2 flex items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105">
                <IconComp className="bottom-icon w-5 h-5" />
              </div>
              <span className="bottom-label text-[12px] font-bold text-[#374151] group-hover:text-[#0f8a4b] transition tracking-wider uppercase text-center px-1 whitespace-pre-line leading-snug">
                {card.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
