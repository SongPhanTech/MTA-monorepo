import { WeekScheduleEntryItem } from "@components/lich-tuan/week-schedule-shared"
import { WeekScheduleLeaderHead } from "@components/lich-tuan/week-schedule-leader-head"
import type { WeekScheduleEntry, WeekScheduleLeader } from "@/types/work-schedule-week-view"
import dayjs from "dayjs"

type MonthDay = {
  key: string
  weekdayLabel: string
  dateLabel: string
  dayNumber: number
  isToday: boolean
  isWeekend: boolean
}

type MonthScheduleMatrixProps = {
  monthDays: MonthDay[]
  leaders: WeekScheduleLeader[]
  entriesByCell: Map<string, WeekScheduleEntry[]>
  monthStart: Date
  returnPath: string
  onEntryClick?: (entry: WeekScheduleEntry, leader: WeekScheduleLeader) => void
}

export function MonthScheduleMatrix({
  monthDays,
  leaders,
  entriesByCell,
  monthStart,
  returnPath,
  onEntryClick,
}: MonthScheduleMatrixProps) {
  return (
    <div className="week-schedule-table-wrap month-schedule-table-wrap">
      <table className="week-schedule-table">
        <thead>
          <tr>
            <th className="week-schedule-day-col">Thứ / Ngày</th>
            {leaders.map((leader) => (
              <th key={leader.id}>
                <WeekScheduleLeaderHead
                  leader={leader}
                  periodStart={dayjs(monthStart).format("YYYY-MM-DD")}
                  periodType="month"
                  returnPath={returnPath}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {monthDays.map((day) => (
            <tr
              key={day.key}
              className={[day.isToday ? "is-today" : "", day.isWeekend ? "is-weekend" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <td className="week-schedule-day-col">
                <div className="week-schedule-day-cell">
                  <div className="week-schedule-day-name">{day.weekdayLabel}</div>
                  <div className="week-schedule-day-date">({day.dateLabel})</div>
                </div>
              </td>

              {leaders.map((leader) => {
                const cellEntries = entriesByCell.get(`${day.key}:${leader.id}`) ?? []

                return (
                  <td key={`${day.key}-${leader.id}`} className="week-schedule-cell">
                    {cellEntries.length === 0 ? (
                      <div className="week-schedule-empty">—</div>
                    ) : (
                      cellEntries.map((entry) => (
                        <WeekScheduleEntryItem
                          key={entry.id}
                          entry={entry}
                          onClick={onEntryClick ? () => onEntryClick(entry, leader) : undefined}
                        />
                      ))
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
