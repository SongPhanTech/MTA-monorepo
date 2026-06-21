import { SO_TAG_HIEN_THI_TOI_DA } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { cn } from "@workspace/ui/lib/utils"
import type { PersonalWorkTag } from "@workspace/db/client"
import { Dropdown, Popover } from "antd"
import type { MenuProps } from "antd"
import { Plus } from "lucide-react"
import { forwardRef, useMemo, useState, type MouseEvent } from "react"

interface ChonLoaiLichProps {
  tags: Pick<PersonalWorkTag, "id" | "name" | "color">[]
  value?: string
  onChange?: (tagId: string) => void
  onThemLoai: () => void
  onSuaLoai?: (tagId: string) => void
  onXoaLoai?: (tagId: string) => void
  dangTai?: boolean
}

const NutLoaiLich = ({
  tag,
  dangChon,
  onClick,
  onDoubleClick,
  className,
}: {
  tag: Pick<PersonalWorkTag, "id" | "name" | "color">
  dangChon: boolean
  onClick: () => void
  onDoubleClick?: (event: MouseEvent<HTMLButtonElement>) => void
  className?: string
}) => {
  const mau = tag.color ?? MAU_LOAI_MAC_DINH

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium transition-all",
        dangChon
          ? "border-2 bg-white shadow-none"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
        className
      )}
      style={{
        borderColor: dangChon ? mau : undefined,
        backgroundColor: dangChon ? `${mau}14` : undefined,
        color: dangChon ? mau : undefined,
      }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: mau }}
        aria-hidden
      />
      <span className="truncate">{tag.name}</span>
    </button>
  )
}

const NutLoaiLichCoMenu = ({
  tag,
  dangChon,
  onSelect,
  onSuaLoai,
  onXoaLoai,
  className,
}: {
  tag: Pick<PersonalWorkTag, "id" | "name" | "color">
  dangChon: boolean
  onSelect: (tagId: string) => void
  onSuaLoai?: (tagId: string) => void
  onXoaLoai?: (tagId: string) => void
  className?: string
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const menu: MenuProps = {
    items: [
      { key: "edit", label: "Sửa loại lịch" },
      { key: "delete", label: "Xóa loại lịch", danger: true },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation()
      setMenuOpen(false)
      if (key === "edit") onSuaLoai?.(tag.id)
      if (key === "delete") onXoaLoai?.(tag.id)
    },
  }

  return (
    <Dropdown menu={menu} open={menuOpen} onOpenChange={setMenuOpen} trigger={[]}>
      <NutLoaiLich
        tag={tag}
        dangChon={dangChon}
        className={className}
        onClick={() => onSelect(tag.id)}
        onDoubleClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setMenuOpen(true)
        }}
      />
    </Dropdown>
  )
}

const ChonLoaiLich = forwardRef<HTMLDivElement, ChonLoaiLichProps>(function ChonLoaiLich(
  { tags, value, onChange, onThemLoai, onSuaLoai, onXoaLoai, dangTai },
  ref
) {
  const { tagsChinh, tagsConLai } = useMemo(() => {
    const tagsChinh = tags.slice(0, SO_TAG_HIEN_THI_TOI_DA)
    const tagsConLai = tags.slice(SO_TAG_HIEN_THI_TOI_DA)
    return { tagsChinh, tagsConLai }
  }, [tags])

  const dangChonOverflow = tagsConLai.some((tag) => tag.id === value)

  if (dangTai) {
    return (
      <div ref={ref} className="flex w-full gap-2">
        {Array.from({ length: SO_TAG_HIEN_THI_TOI_DA }, (_, i) => (
          <div key={i} className="h-10 flex-1 animate-pulse rounded-lg bg-gray-100" />
        ))}
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div ref={ref} className="flex w-full items-stretch gap-2">
      {tagsChinh.map((tag) => (
        <NutLoaiLichCoMenu
          key={tag.id}
          tag={tag}
          dangChon={value === tag.id}
          onSelect={(tagId) => onChange?.(tagId)}
          onSuaLoai={onSuaLoai}
          onXoaLoai={onXoaLoai}
        />
      ))}

      {tagsConLai.length > 0 ? (
        <Popover
          trigger="click"
          placement="bottom"
          content={
            <div className="flex min-w-[160px] flex-col gap-1">
              {tagsConLai.map((tag) => (
                <NutLoaiLichCoMenu
                  key={tag.id}
                  tag={tag}
                  dangChon={value === tag.id}
                  onSelect={(tagId) => onChange?.(tagId)}
                  onSuaLoai={onSuaLoai}
                  onXoaLoai={onXoaLoai}
                  className="w-full flex-none"
                />
              ))}
            </div>
          }
        >
          <button
            type="button"
            className={cn(
              "inline-flex h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-all",
              dangChonOverflow
                ? "border-2 border-cgv-green-dark bg-cgv-green/20 text-cgv-green-dark"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
            aria-label={`Thêm ${tagsConLai.length} loại lịch`}
          >
            +{tagsConLai.length}
          </button>
        </Popover>
      ) : null}

      <button
        type="button"
        onClick={onThemLoai}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-cgv-green-dark hover:text-cgv-green-dark"
        aria-label="Thêm loại lịch"
        title="Thêm loại lịch"
      >
        <Plus size={18} />
      </button>
    </div>
  )
})

export default ChonLoaiLich
