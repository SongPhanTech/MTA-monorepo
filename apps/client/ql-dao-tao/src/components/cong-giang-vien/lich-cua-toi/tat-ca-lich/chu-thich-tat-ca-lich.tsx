import type { TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { MAU_SU_KIEN_LICH_GIANG_DAY } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import { TEN_LOAI_GIANG_DAY } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/utils"
import { cn } from "@workspace/ui/lib/utils"

interface ChuThichTatCaLichProps {
  tags: TagLoaiLich[]
  className?: string
}

const ChuThichTatCaLich = ({ tags, className }: ChuThichTatCaLichProps) => {
  const muc = [
    { name: TEN_LOAI_GIANG_DAY, color: MAU_SU_KIEN_LICH_GIANG_DAY },
    ...tags.map((tag) => ({
      name: tag.name,
      color: tag.color ?? MAU_LOAI_MAC_DINH,
    })),
  ]

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600",
        className
      )}
    >
      <span className="font-semibold text-gray-700">Chú thích:</span>
      {muc.map((item) => (
        <span key={item.name} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-4 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.name}
        </span>
      ))}
    </div>
  )
}

export default ChuThichTatCaLich
