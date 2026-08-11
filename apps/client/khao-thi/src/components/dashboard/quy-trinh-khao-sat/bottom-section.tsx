import {
  CalendarRange,
  BookOpen,
  HelpCircle,
  Users,
  User,
  Settings,
  ArrowDown,
  FileText,
  CheckSquare,
  BarChart2,
  PieChart,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { QuyTrinhView } from "./types"

interface BottomSectionProps {
  view: QuyTrinhView
}

interface BottomLink {
  label: string
  icon: LucideIcon
}

const viewConfig: Record<QuyTrinhView, { links: BottomLink[]; lgCols: string }> = {
  main: {
    lgCols: "lg:grid-cols-6",
    links: [
      { label: "HỌC KỲ /\nNĂM HỌC", icon: CalendarRange },
      { label: "MÔN HỌC /\nLỚP HỌC PHẦN", icon: BookOpen },
      { label: "CHỦ ĐỀ &\nBỘ CÂU HỎI", icon: HelpCircle },
      { label: "ĐỐI TƯỢNG\nKHẢO SÁT", icon: Users },
      { label: "TÀI KHOẢN\nNGƯỜI DÙNG", icon: User },
      { label: "CẤU HÌNH\nKHẢO SÁT", icon: Settings },
    ],
  },
  "chuan-bi": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Chủ đề khảo sát", icon: HelpCircle },
      { label: "Bộ câu hỏi khảo sát", icon: FileText },
      { label: "Đối tượng áp dụng", icon: Users },
      { label: "Cấu hình tham số", icon: Settings },
    ],
  },
  "tao-dot": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Danh sách đợt khảo sát", icon: CalendarRange },
      { label: "Thiết lập đợt khảo sát", icon: Settings },
      { label: "Lớp học phần", icon: BookOpen },
      { label: "Danh sách học viên", icon: User },
    ],
  },
  "trien-khai": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Danh sách cuộc khảo sát", icon: CheckSquare },
      { label: "Gửi thông báo khảo sát", icon: Users },
      { label: "Khảo sát cụm", icon: BookOpen },
      { label: "Tiến độ thực hiện", icon: BarChart2 },
    ],
  },
  "thuc-hien": {
    lgCols: "lg:grid-cols-3",
    links: [
      { label: "Phiếu khảo sát", icon: FileText },
      { label: "Danh sách người khảo sát", icon: User },
      { label: "Trạng thái hoàn thành", icon: CheckSquare },
    ],
  },
  "tong-hop": {
    lgCols: "lg:grid-cols-3",
    links: [
      { label: "Tổng hợp kết quả", icon: BarChart2 },
      { label: "Thống kê câu trả lời", icon: PieChart },
      { label: "Xuất dữ liệu", icon: FileText },
    ],
  },
  "phan-tich": {
    lgCols: "lg:grid-cols-3",
    links: [
      { label: "Báo cáo giảng viên", icon: PieChart },
      { label: "Báo cáo phân tích", icon: BarChart2 },
      { label: "Xuất báo cáo PDF/Excel", icon: FileText },
    ],
  },
  "ket-thuc": {
    lgCols: "lg:grid-cols-3",
    links: [
      { label: "Đóng đợt khảo sát", icon: CheckSquare },
      { label: "Lưu trữ kết quả", icon: CalendarRange },
      { label: "Tổng kết đánh giá", icon: BarChart2 },
    ],
  },
}

export function BottomSection({ view }: BottomSectionProps) {
  const config = viewConfig[view] ?? viewConfig.main
  const links = config.links

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg p-4 border border-[#e8eaed] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-[#0f8a4b] font-bold text-[13px] uppercase tracking-[0.04em]">
        <ArrowDown className="h-4 w-4" />
        <span>ĐẦU VÀO</span>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 ${config.lgCols} gap-4`}>
        {links.map((card, idx) => {
          const IconComp = card.icon
          return (
            <div
              key={idx}
              className="group bottom-card p-2 flex flex-col items-center justify-center rounded-lg transition duration-300 relative cursor-default"
            >
              {idx < links.length - 1 && (
                <div className="absolute right-[-8px] top-0 bottom-0 w-[1px] bg-[#e5e7eb] hidden sm:block" />
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
