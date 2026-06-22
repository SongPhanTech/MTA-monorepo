import { LOAI_LICH_META } from "@components/cong-giang-vien/giang-vien/types"
import { cn } from "@workspace/ui/lib/utils"

const CHU_THICH_HIEN_THI = ["THEORY", "PRACTICE", "CHECK", "EXAM", "WEEK"] as const

const ChuThichLoaiLich = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm",
        className
      )}
    >
      <span className="font-semibold text-gray-700">Chú thích:</span>
      {CHU_THICH_HIEN_THI.map((loai) => {
        const meta = LOAI_LICH_META[loai]
        return (
          <span key={loai} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-2.5 w-4 rounded-sm border-l-[3px]",
                meta.blockBg,
                meta.blockBorder
              )}
              aria-hidden
            />
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}

export default ChuThichLoaiLich
