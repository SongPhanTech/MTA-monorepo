import { MAU_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { cn } from "@workspace/ui/lib/utils"
import type { PersonalWorkTag } from "@workspace/db/client"
import { BookOpen, Plus, Tag, User, Users } from "lucide-react"
import { type ReactNode, forwardRef } from "react"

interface ChonLoaiLichProps {
  tags: Pick<PersonalWorkTag, "id" | "name" | "color">[]
  value?: string
  onChange?: (tagId: string) => void
  onThemLoai: () => void
  dangTai?: boolean
}

const iconTheoTen = (ten: string, mau: string): ReactNode => {
  const chuan = ten.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  if (chuan.includes("hop")) return <Users size={15} style={{ color: mau }} />
  if (chuan.includes("ca nhan")) return <User size={15} style={{ color: mau }} />
  if (chuan.includes("cong viec") || chuan.includes("viec")) {
    return <BookOpen size={15} style={{ color: mau }} />
  }
  return <Tag size={15} style={{ color: mau }} />
}

const ChonLoaiLich = forwardRef<HTMLDivElement, ChonLoaiLichProps>(function ChonLoaiLich(
  { tags, value, onChange, onThemLoai, dangTai },
  ref
) {
  if (dangTai) {
    return (
      <div ref={ref} className="text-sm text-gray-400">
        Đang tải loại lịch...
      </div>
    )
  }

  return (
    <div ref={ref} className="flex w-full flex-wrap items-center gap-2.5">
      {tags.map((tag) => {
        const mau = tag.color ?? MAU_LOAI_LICH_MAC_DINH[0]
        const dangChon = value === tag.id
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onChange?.(tag.id)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all",
              dangChon ? "shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
            )}
            style={{
              borderColor: dangChon ? mau : undefined,
              color: mau,
              backgroundColor: dangChon ? `${mau}18` : undefined,
            }}
          >
            {iconTheoTen(tag.name, mau)}
            {tag.name}
          </button>
        )
      })}

      <button
        type="button"
        onClick={onThemLoai}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-cgv-green-dark hover:text-cgv-green-dark"
        aria-label="Thêm loại lịch"
        title="Thêm loại lịch"
      >
        <Plus size={18} />
      </button>
    </div>
  )
})

export default ChonLoaiLich
