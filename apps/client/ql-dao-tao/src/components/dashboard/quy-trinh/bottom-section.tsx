import {
  FolderOpen,
  BookOpen,
  User,
  Users,
  Building,
  CalendarRange,
  Users2,
  CheckSquare,
  School,
  GraduationCap,
  FileText,
  UserCog,
  Clock,
  FileStack,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { QuyTrinhView } from "./types"
import { useThesisTrack, type ThesisTrack } from "./thesis-track"

interface BottomSectionProps {
  view: QuyTrinhView
}

interface BottomLink {
  label: string
  icon: LucideIcon
  path?: string
  track?: Exclude<ThesisTrack, "both">
}

const viewConfig: Record<QuyTrinhView, { links: BottomLink[]; lgCols: string }> = {
  main: {
    lgCols: "lg:grid-cols-6",
    links: [
      { label: "Danh mục đào tạo", icon: FolderOpen },
      { label: "Khóa đào tạo", icon: BookOpen },
      { label: "Chương trình đào tạo", icon: BookOpen },
      { label: "Học viên", icon: User },
      { label: "Giảng viên", icon: Users },
      { label: "Lớp quản lý", icon: Users },
    ],
  },
  "len-ke-hoach": {
    lgCols: "lg:grid-cols-5",
    links: [
      { label: "Chương trình đào tạo", icon: BookOpen },
      { label: "Danh sách lớp học viên", icon: Users },
      { label: "Giảng viên & định mức", icon: User },
      { label: "Cơ sở vật chất", icon: Building },
      { label: "Kế hoạch năm học / học kỳ", icon: CalendarRange },
    ],
  },
  "to-chuc-thi": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Kế hoạch giảng dạy", icon: BookOpen },
      { label: "Danh sách học viên đủ điều kiện dự thi", icon: Users2 },
      { label: "Quy chế thi - đánh giá", icon: CheckSquare },
      { label: "Nguồn lực tổ chức thi", icon: School },
    ],
  },
  "xet-tot-nghiep": {
    lgCols: "lg:grid-cols-5",
    links: [
      { label: "Học viên", icon: GraduationCap },
      { label: "Kết quả học tập", icon: FileText },
      { label: "Kết quả rèn luyện", icon: UserCog },
      { label: "Kết quả khóa luận / luận văn / luận án", icon: BookOpen },
      { label: "Chuẩn đầu ra & Quy chế", icon: CheckSquare },
    ],
  },
  "quan-ly-diem": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Hồ sơ học viên", icon: User },
      { label: "Kết quả học tập", icon: FileText },
      { label: "Kết quả công nhận (chứng chỉ, chuyển trường, liên kết)", icon: CheckSquare },
      { label: "Kết quả rèn luyện", icon: UserCog },
    ],
  },
  "quan-ly-khoa-luan": {
    lgCols: "lg:grid-cols-4",
    links: [
      { label: "Lớp môn học khóa luận tốt nghiệp", icon: School, track: "kltn" },
      { label: "Đợt xét luận văn / luận án", icon: CalendarRange, track: "luan-van" },
      { label: "Chuyên gia khóa luận tốt nghiệp", icon: Users, track: "kltn" },
      { label: "Chuyên gia luận văn / luận án", icon: Users, track: "luan-van" },
      { label: "Thời gian bảo vệ khóa luận tốt nghiệp", icon: Clock, track: "kltn" },
      { label: "Thời gian bảo vệ luận văn / luận án", icon: Clock, track: "luan-van" },
      { label: "Chương trình đào tạo", icon: BookOpen },
      { label: "Mẫu biểu luận văn / luận án", icon: FileStack, track: "luan-van" },
    ],
  },
}

function resolveLgCols(view: QuyTrinhView, thesisTrack: ThesisTrack, fallback: string) {
  if (view !== "quan-ly-khoa-luan") return fallback
  if (thesisTrack === "kltn") return "lg:grid-cols-4"
  if (thesisTrack === "luan-van") return "lg:grid-cols-5"
  return fallback
}

export function BottomSection({ view }: BottomSectionProps) {
  const thesisTrack = useThesisTrack()
  const config = viewConfig[view]
  const links =
    view === "quan-ly-khoa-luan" && thesisTrack !== "both"
      ? config.links.filter((item) => !item.track || item.track === thesisTrack)
      : config.links
  const lgCols = resolveLgCols(view, thesisTrack, config.lgCols)

  return (
    <div className="quy-trinh-bottom flex flex-col gap-1 rounded-lg border bg-white p-4">
      <div className={`quy-trinh-bottom-grid grid grid-cols-2 gap-4 sm:grid-cols-3 ${lgCols}`}>
        {links.map((card, idx) => {
          const IconComp = card.icon
          return (
            <div
              key={idx}
              className={`group bottom-card p-2 flex flex-col items-center justify-center rounded-lg transition duration-300 relative ${
                card.path ? "cursor-pointer hover:bg-[#f0fdf4]/60" : "cursor-default"
              }`}
            >
              {idx < links.length - 1 && (
                <div className="absolute right-[-8px] top-0 bottom-0 w-[1px] bg-[#e5e7eb]" />
              )}
              <div className="bottom-icon-container mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105 max-xl:mb-1 max-xl:h-7 max-xl:w-7">
                <IconComp className="bottom-icon h-5 w-5 max-xl:h-3.5 max-xl:w-3.5" />
              </div>
              <span className="bottom-label px-1 text-center text-[12px] font-bold uppercase tracking-wider text-[#374151] transition group-hover:text-[#0f8a4b] max-xl:text-[9px] max-xl:leading-tight max-xl:tracking-normal">
                {card.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
