import {
  LOAI_THONG_BAO_META,
  MUC_CANH_BAO_META,
  type ThongBaoView,
} from "@components/cong-giang-vien/thong-bao/types"
import { cn } from "@lib/utils"
import { Tooltip } from "antd"
import { CheckCheck, ChevronRight } from "lucide-react"
import type { MouseEvent } from "react"

interface TheThongBaoProps {
  thongBao: ThongBaoView
  compact?: boolean
  onClick?: (id: string) => void
  onDanhDauDaDoc?: (id: string) => void
}

const TheThongBao = ({ thongBao, compact, onClick, onDanhDauDaDoc }: TheThongBaoProps) => {
  const loaiMeta = LOAI_THONG_BAO_META[thongBao.loai]
  const mucMeta = MUC_CANH_BAO_META[thongBao.mucCanhBao]
  const Icon = loaiMeta.Icon

  const handleDanhDauDaDoc = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onDanhDauDaDoc?.(thongBao.id)
  }

  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-lg border text-left shadow-sm transition",
        thongBao.daDoc
          ? "border-gray-100 bg-gray-50/80"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow",
        !thongBao.daDoc && mucMeta.cardBg
      )}
    >
      <button
        type="button"
        onClick={() => onClick?.(thongBao.id)}
        className="flex min-w-0 flex-1 cursor-pointer items-stretch gap-0 border-none bg-transparent p-0 text-left"
      >
        <div className={cn("w-1 shrink-0", mucMeta.accent, thongBao.daDoc && "opacity-50")} />

        <div
          className={cn("flex min-w-0 flex-1 items-center gap-3", compact ? "p-2" : "gap-4 p-4")}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full",
              compact ? "h-8 w-8" : "h-11 w-11",
              loaiMeta.iconBg,
              thongBao.daDoc && "opacity-70"
            )}
          >
            <Icon size={compact ? 16 : 20} className={loaiMeta.iconColor} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              {!thongBao.daDoc ? (
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              ) : null}
              <p
                className={cn(
                  "m-0 truncate uppercase text-gray-900",
                  compact ? "text-xs" : "text-sm",
                  thongBao.daDoc ? "font-medium text-gray-600" : "font-bold"
                )}
              >
                {thongBao.tieuDe}
              </p>
            </div>
            {!compact ? (
              <p
                className={cn(
                  "m-0 mt-1 line-clamp-2 text-sm",
                  thongBao.daDoc ? "text-gray-400" : "text-gray-600"
                )}
              >
                {thongBao.tomTat}
              </p>
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
              {!compact ? (
                <span
                  className={cn(
                    "inline-block rounded px-2 py-0.5 text-xs font-medium",
                    thongBao.daDoc ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-700"
                  )}
                >
                  {thongBao.daDoc ? "Đã đọc" : "Chưa đọc"}
                </span>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col items-end pl-1",
              compact ? "gap-1" : "gap-2 pl-2"
            )}
          >
            <span className="whitespace-nowrap text-[10px] text-gray-500 sm:text-xs">
              {compact ? thongBao.thoiGian.split(" • ")[0] : thongBao.thoiGian}
            </span>
            {thongBao.hanXuLy && !compact ? (
              <span className="text-[10px] text-gray-400 sm:text-xs">Hạn: {thongBao.hanXuLy}</span>
            ) : null}
            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
              <span
                className={cn("inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2", mucMeta.dot)}
              />
              {!compact ? (
                <span className={cn("font-medium", mucMeta.statusColor)}>{mucMeta.label}</span>
              ) : null}
            </div>
          </div>

          {!compact ? <ChevronRight size={18} className="shrink-0 text-gray-400" /> : null}
        </div>
      </button>

      {!compact && !thongBao.daDoc && onDanhDauDaDoc ? (
        <Tooltip title="Đánh dấu đã đọc">
          <button
            type="button"
            onClick={handleDanhDauDaDoc}
            className="flex w-11 shrink-0 cursor-pointer items-center justify-center border-none border-l border-gray-100 bg-transparent text-gray-400 transition hover:bg-gray-50 hover:text-cgv-green-dark"
            aria-label="Đánh dấu đã đọc"
          >
            <CheckCheck size={18} />
          </button>
        </Tooltip>
      ) : null}
    </div>
  )
}

export default TheThongBao
