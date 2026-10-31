import { cn } from "@workspace/ui/lib/utils"

export type FilterStatus = "YEU_CAU_PCGD" | "LMH_DA_HUY" | "CHO_DUYET_PCGD" | "DA_DUYET_PCGD"

export const LEGEND_ITEMS: { key: FilterStatus; dot: string; label: string }[] = [
  { key: "YEU_CAU_PCGD", dot: "bg-slate-200", label: "Yêu cầu PCGD" },
  { key: "LMH_DA_HUY", dot: "bg-red-200", label: "LMH đã huỷ" },
  { key: "CHO_DUYET_PCGD", dot: "bg-yellow-200", label: "Chờ duyệt PCGD" },
  { key: "DA_DUYET_PCGD", dot: "bg-green-200", label: "Đã duyệt PCGD" },
]

type StatusFilterChipsProps = {
  value?: FilterStatus
  onChange: (next?: FilterStatus) => void
  className?: string
}

export default function StatusFilterChips({ value, onChange, className }: StatusFilterChipsProps) {
  return (
    <div className={cn("flex min-w-[180px] flex-col gap-0.5 py-0.5", className)}>
      {LEGEND_ITEMS.map((item) => {
        const active = value === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(active ? undefined : item.key)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-[13px]",
              active ? "bg-primary/10 font-medium text-primary" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", item.dot)} />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
