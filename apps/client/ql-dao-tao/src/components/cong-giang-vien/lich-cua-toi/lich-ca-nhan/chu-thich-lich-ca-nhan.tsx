import { MAU_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import type { TagLoaiLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { cn } from "@workspace/ui/lib/utils"

interface ChuThichLichCaNhanProps {
  tags: TagLoaiLich[]
  className?: string
}

const ChuThichLichCaNhan = ({ tags, className }: ChuThichLichCaNhanProps) => {
  if (tags.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600", className)}>
      {tags.map((tag, index) => {
        const mau = tag.color ?? MAU_LOAI_LICH_MAC_DINH[index % MAU_LOAI_LICH_MAC_DINH.length]
        return (
          <span key={tag.id} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: mau }}
              aria-hidden
            />
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}

export default ChuThichLichCaNhan
