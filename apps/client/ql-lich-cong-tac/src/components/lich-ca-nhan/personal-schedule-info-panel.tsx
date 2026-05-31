import type { LeaderPersonalProfile } from "@/types/personal-schedule"
import type { WeekScheduleLeader } from "@/types/work-schedule-week-view"

type PersonalScheduleInfoPanelProps = {
  leader: WeekScheduleLeader
  profile: LeaderPersonalProfile
}

export function PersonalScheduleInfoPanel({ leader, profile }: PersonalScheduleInfoPanelProps) {
  return (
    <div className="personal-schedule-info">
      <div className="personal-schedule-info-section">
        <div className="personal-schedule-info-title">Thông tin chung</div>
        <div className="personal-schedule-info-line">Chức vụ: {leader.rankTitle}</div>
        <div className="personal-schedule-info-line">Điện thoại: {profile.phone}</div>
        <div className="personal-schedule-info-line">Email: {profile.email}</div>
      </div>

      <div className="personal-schedule-info-section">
        <div className="personal-schedule-info-title">Ghi chú</div>
        <ul className="personal-schedule-info-notes">
          {profile.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
