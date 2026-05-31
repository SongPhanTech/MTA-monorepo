import type { PersonalScheduleDayRow } from "@/types/personal-schedule"

type PersonalScheduleTableProps = {
  rows: PersonalScheduleDayRow[]
}

export function PersonalScheduleTable({ rows }: PersonalScheduleTableProps) {
  return (
    <div className="personal-schedule-table-wrap">
      <table className="personal-schedule-table">
        <thead>
          <tr>
            <th className="col-day">Ngày làm việc</th>
            <th className="col-time">Thời gian</th>
            <th>Nội dung</th>
            <th className="col-location">Địa điểm</th>
            <th className="col-note">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="col-day">{row.dayLabel}</td>
              <td className="col-time">{row.time || ""}</td>
              <td>{row.content || ""}</td>
              <td className="col-location">{row.location || ""}</td>
              <td className="col-note">{row.note || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
