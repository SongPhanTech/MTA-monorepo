import { ROUTER_PATH } from "@workspace/router"
import type { PersonalSchedulePeriodType } from "@/types/personal-schedule"

type BuildPersonalScheduleHrefOptions = {
  leaderId: string
  periodStart: string
  periodType: PersonalSchedulePeriodType
  from: string
}

export function buildPersonalScheduleHref({
  leaderId,
  periodStart,
  periodType,
  from,
}: BuildPersonalScheduleHrefOptions) {
  const params = new URLSearchParams({
    leaderId,
    periodStart,
    periodType,
    from,
  })

  return `${ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_CA_NHAN}?${params.toString()}`
}
