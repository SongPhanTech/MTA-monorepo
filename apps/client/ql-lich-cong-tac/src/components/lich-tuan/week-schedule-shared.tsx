import { getWeekScheduleEntryTypeMeta } from "@constants/work-schedule-week-mock"
import type { WeekScheduleEntry, WeekScheduleEntryType } from "@/types/work-schedule-week-view"
import { cn } from "@lib/utils"

const ENTRY_CLASS: Record<WeekScheduleEntry["type"], string> = {
  ORIGINAL: "week-schedule-entry--original",
  SUPPLEMENT: "week-schedule-entry--supplement",
  DUTY: "week-schedule-entry--duty",
  PARTICIPANT: "week-schedule-entry--participant",
}

type WeekScheduleEntryItemProps = {
  entry: WeekScheduleEntry
  onClick?: (entry: WeekScheduleEntry) => void
}

export function WeekScheduleEntryItem({ entry, onClick }: WeekScheduleEntryItemProps) {
  const isDraft = entry.publishStatus === "DRAFT"

  return (
    <button
      type="button"
      className={cn(
        "week-schedule-entry",
        ENTRY_CLASS[entry.type],
        isDraft ? "week-schedule-entry--draft" : "week-schedule-entry--published",
        onClick ? "week-schedule-entry--clickable" : null
      )}
      onClick={() => onClick?.(entry)}
    >
      {isDraft ? (
        <span className="week-schedule-entry-badge week-schedule-entry-badge--draft">Nháp</span>
      ) : null}
      {entry.time ? <span className="week-schedule-entry-time">{entry.time} </span> : null}
      <span>{entry.content}</span>
    </button>
  )
}

type WeekScheduleLegendProps = {
  className?: string
  hiddenTypes?: Set<WeekScheduleEntryType>
  onToggleType?: (type: WeekScheduleEntryType) => void
}

export function WeekScheduleLegend({
  className,
  hiddenTypes,
  onToggleType,
}: WeekScheduleLegendProps) {
  const isInteractive = Boolean(onToggleType)

  return (
    <div className={cn("week-schedule-legend", className)}>
      {(["ORIGINAL", "SUPPLEMENT", "DUTY", "PARTICIPANT"] as const).map((type) => {
        const meta = getWeekScheduleEntryTypeMeta(type)
        const isHidden = hiddenTypes?.has(type)

        return (
          <button
            key={type}
            type="button"
            className={cn(
              "week-schedule-legend-item",
              isInteractive && "week-schedule-legend-item--interactive",
              isHidden && "week-schedule-legend-item--inactive"
            )}
            onClick={isInteractive ? () => onToggleType?.(type) : undefined}
            disabled={!isInteractive}
          >
            {type === "PARTICIPANT" ? (
              <span
                className="week-schedule-legend-chip"
                style={{ backgroundColor: "#f7eedf", border: "1px solid #d4b896" }}
              />
            ) : (
              <span
                className="week-schedule-legend-dot"
                style={{ backgroundColor: meta.dotColor }}
              />
            )}
            {meta.label}
          </button>
        )
      })}
      {isInteractive ? (
        <span className="week-schedule-legend-hint">Bấm để ẩn/hiện loại lịch</span>
      ) : null}
    </div>
  )
}
