import { ROUTER_PATH } from "@workspace/router"
import {
  ArrowDown,
  Award,
  Building2,
  Clock,
  Contact,
  GraduationCap,
  ListOrdered,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/router"

interface BottomLink {
  label: string
  icon: LucideIcon
  path: string
}

const inputLinks: BottomLink[] = [
  {
    label: "TRÌNH ĐỘ\nHỌC VẤN",
    icon: GraduationCap,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_HOC_VAN,
  },
  {
    label: "NGẠCH /\nBẬC LƯƠNG",
    icon: ListOrdered,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGACH,
  },
  {
    label: "ĐƠN VỊ /\nTỔ CHỨC",
    icon: Building2,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO,
  },
  {
    label: "HÌNH THỨC\nKHEN THƯỞNG",
    icon: Award,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_CHINH_QUYEN,
  },
  {
    label: "QUAN HỆ\nTHÂN NHÂN",
    icon: Contact,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_QUAN_HE_THAN_NHAN,
  },
  {
    label: "TRẠNG THÁI\nLÀM VIỆC",
    icon: Clock,
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRANG_THAI_LAM_VIEC,
  },
]

export function BottomSection() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#e8eaed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.04em] text-[#0f8a4b]">
        <ArrowDown className="h-4 w-4" />
        <span>ĐẦU VÀO</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {inputLinks.map((card, idx) => {
          const IconComp = card.icon
          return (
            <button
              type="button"
              key={card.label}
              onClick={() => router.push(card.path)}
              className="bottom-card group relative flex cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent p-2 text-center transition duration-300"
            >
              {idx < inputLinks.length - 1 && (
                <div className="absolute top-0 right-[-8px] bottom-0 hidden w-px bg-[#e5e7eb] sm:block" />
              )}
              <div className="bottom-icon-container mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#0f8a4b] transition group-hover:scale-105">
                <IconComp className="bottom-icon h-5 w-5" />
              </div>
              <span className="bottom-label px-1 text-[12px] font-bold uppercase leading-snug tracking-wider text-[#374151] transition group-hover:text-[#0f8a4b] whitespace-pre-line">
                {card.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
