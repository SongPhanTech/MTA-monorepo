import {
  LOAI_THONG_BAO_META,
  MUC_CANH_BAO_META,
  type ThongBaoView,
} from "@components/cong-giang-vien/thong-bao/types"
import { cn } from "@lib/utils"
import { ChevronRight } from "lucide-react"

interface TheThongBaoProps {
  thongBao: ThongBaoView
  compact?: boolean
  onClick?: (id: string) => void
}

const TheThongBao = ({ thongBao, compact, onClick }: TheThongBaoProps) => {
  const loaiMeta = LOAI_THONG_BAO_META[thongBao.loai]
  const mucMeta = MUC_CANH_BAO_META[thongBao.mucCanhBao]
  const Icon = loaiMeta.Icon

  return (
    <button
      type="button"
      onClick={() => onClick?.(thongBao.id)}
      className={cn(
        "flex w-full cursor-pointer items-stretch gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:border-gray-300 hover:shadow",
        mucMeta.cardBg,
        !thongBao.daDoc && "ring-1 ring-inset ring-black/5"
      )}
    >
      <div className={cn("w-1 shrink-0", mucMeta.accent)} />

      <div className={cn("flex min-w-0 flex-1 items-center gap-3", compact ? "p-2" : "gap-4 p-4")}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            compact ? "h-8 w-8" : "h-11 w-11",
            loaiMeta.iconBg
          )}
        >
          <Icon size={compact ? 16 : 20} className={loaiMeta.iconColor} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "m-0 truncate font-bold uppercase text-gray-900",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {thongBao.tieuDe}
          </p>
          {!compact ? (
            <p className="m-0 mt-1 line-clamp-2 text-sm text-gray-600">{thongBao.tomTat}</p>
          ) : null}
          <div className={cn("flex flex-wrap gap-1.5", compact ? "mt-1" : "mt-2")}>
            <span
              className={cn(
                "inline-block rounded px-2 py-0.5 text-xs font-medium",
                loaiMeta.tagBg,
                loaiMeta.tagColor
              )}
            >
              {loaiMeta.tagLabel}
            </span>
            <span
              className={cn(
                "inline-block rounded px-2 py-0.5 text-xs font-medium",
                mucMeta.tagBg,
                mucMeta.tagColor
              )}
            >
              {mucMeta.tagLabel}
            </span>
          </div>
        </div>

        <div className={cn("flex shrink-0 flex-col items-end pl-1", compact ? "gap-1" : "gap-2 pl-2")}>
          <span className="whitespace-nowrap text-[10px] text-gray-500 sm:text-xs">
            {compact ? thongBao.thoiGian.split(" • ")[0] : thongBao.thoiGian}
          </span>
          {thongBao.hanXuLy && !compact ? (
            <span className="text-[10px] text-gray-400 sm:text-xs">Hạn: {thongBao.hanXuLy}</span>
          ) : null}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2", mucMeta.dot)} />
            {!compact ? (
              <span className={cn("font-medium", mucMeta.statusColor)}>{mucMeta.label}</span>
            ) : null}
          </div>
        </div>

        {!compact ? <ChevronRight size={18} className="shrink-0 text-gray-400" /> : null}
      </div>
    </button>
  )
}

export default TheThongBao
