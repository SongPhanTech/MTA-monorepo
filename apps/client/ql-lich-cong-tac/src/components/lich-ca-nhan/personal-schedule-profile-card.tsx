import type { WeekScheduleLeader } from "@/types/work-schedule-week-view"
import { UserOutlined } from "@ant-design/icons"
import type { PersonalSchedulePeriodType } from "@/types/personal-schedule"
import { PersonalSchedulePeriodToolbar } from "./personal-schedule-period-toolbar"
import type dayjs from "dayjs"

type PersonalScheduleProfileCardProps = {
  leader: WeekScheduleLeader
  periodType: PersonalSchedulePeriodType
  periodStart: Date
  periodEnd: Date
  onChangePeriodType: (type: PersonalSchedulePeriodType) => void
  onPreviousPeriod: () => void
  onNextPeriod: () => void
  onPickPeriod: (date: dayjs.Dayjs | null) => void
}

export function PersonalScheduleProfileCard({
  leader,
  periodType,
  periodStart,
  periodEnd,
  onChangePeriodType,
  onPreviousPeriod,
  onNextPeriod,
  onPickPeriod,
}: PersonalScheduleProfileCardProps) {
  return (
    <div className="personal-schedule-profile-card">
      <div className="personal-schedule-profile">
        <div className="personal-schedule-avatar">
          <UserOutlined />
        </div>
        <div className="personal-schedule-profile-text">
          <div className="personal-schedule-rank">{leader.rankTitle}</div>
          <div className="personal-schedule-name">{leader.fullName}</div>
          <div className="personal-schedule-title">
            {periodType === "week" ? "Lịch công tác tuần" : "Lịch công tác tháng"}
          </div>
        </div>
      </div>

      <PersonalSchedulePeriodToolbar
        periodType={periodType}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onChangePeriodType={onChangePeriodType}
        onPreviousPeriod={onPreviousPeriod}
        onNextPeriod={onNextPeriod}
        onPickPeriod={onPickPeriod}
        embedded
      />
    </div>
  )
}
