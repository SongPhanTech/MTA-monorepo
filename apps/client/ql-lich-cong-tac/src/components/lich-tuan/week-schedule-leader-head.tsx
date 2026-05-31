import { buildPersonalScheduleHref } from "@/utils/personal-schedule-link"
import type { WeekScheduleLeader } from "@/types/work-schedule-week-view"
import type { PersonalSchedulePeriodType } from "@/types/personal-schedule"
import { ExportOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import Link from "next/link"

type WeekScheduleLeaderHeadProps = {
  leader: WeekScheduleLeader
  periodStart: string
  periodType?: PersonalSchedulePeriodType
  returnPath: string
}

export function WeekScheduleLeaderHead({
  leader,
  periodStart,
  periodType = "week",
  returnPath,
}: WeekScheduleLeaderHeadProps) {
  const href = buildPersonalScheduleHref({
    leaderId: leader.id,
    periodStart,
    periodType,
    from: returnPath,
  })

  return (
    <div className="week-schedule-leader-head">
      <span className="week-schedule-leader-rank">{leader.rankTitle}</span>
      <div className="week-schedule-leader-name-row">
        <span className="week-schedule-leader-name">{leader.fullName}</span>
        <Tooltip title="Xem lịch cá nhân">
          <Link href={href} className="week-schedule-leader-link" aria-label="Xem lịch cá nhân">
            <ExportOutlined />
          </Link>
        </Tooltip>
      </div>
    </div>
  )
}
