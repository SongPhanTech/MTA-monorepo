import { resolveDefaultWeekLeaderId } from "@/utils/default-leader-id"
import {
  getLeaderById,
  getLeaderProfile,
  getPersonalMonthScheduleRows,
  getPersonalWeekScheduleRows,
} from "@constants/personal-schedule-mock"
import { MOCK_WEEK_START } from "@constants/work-schedule-week-mock"
import type { PersonalSchedulePeriodType } from "@/types/personal-schedule"
import { useSession } from "@workspace/auth/react"
import dayjs, { type Dayjs } from "dayjs"
import { useRouter } from "next/router"
import { useCallback, useMemo } from "react"

type UsePersonalScheduleViewParams = {
  leaderId?: string | string[]
  periodStart?: string | string[]
  periodType?: string | string[]
  from?: string | string[]
}

function parseQueryValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0]
  return value
}

function getDefaultPeriodStart(periodType: PersonalSchedulePeriodType) {
  if (periodType === "month") {
    return dayjs(MOCK_WEEK_START).startOf("month").format("YYYY-MM-DD")
  }

  return dayjs(MOCK_WEEK_START).startOf("isoWeek").format("YYYY-MM-DD")
}

function normalizePeriodStart(periodType: PersonalSchedulePeriodType, value: string) {
  const date = dayjs(value)
  if (periodType === "month") {
    return date.startOf("month").format("YYYY-MM-DD")
  }

  return date.startOf("isoWeek").format("YYYY-MM-DD")
}

export function usePersonalScheduleView(query: UsePersonalScheduleViewParams) {
  const router = useRouter()
  const { data: session } = useSession()
  const sessionName = session?.fullName ?? null
  const defaultLeaderId = resolveDefaultWeekLeaderId(sessionName)
  const leaderId = parseQueryValue(query.leaderId) ?? defaultLeaderId
  const periodType = (parseQueryValue(query.periodType) ?? "week") as PersonalSchedulePeriodType
  const periodStartKey = parseQueryValue(query.periodStart) ?? getDefaultPeriodStart(periodType)
  const from = parseQueryValue(query.from)

  const leader = useMemo(() => getLeaderById(leaderId), [leaderId])
  const profile = useMemo(() => getLeaderProfile(leaderId), [leaderId])

  const schedule = useMemo(() => {
    if (periodType === "month") {
      return getPersonalMonthScheduleRows(leaderId, periodStartKey)
    }

    return getPersonalWeekScheduleRows(leaderId, periodStartKey)
  }, [leaderId, periodStartKey, periodType])

  const periodStartDate = periodType === "month" ? schedule.monthStart : schedule.weekStart
  const periodEndDate = periodType === "month" ? schedule.monthEnd : schedule.weekEnd

  const updateQuery = useCallback(
    (patch: { periodType?: PersonalSchedulePeriodType; periodStart?: string }) => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            leaderId,
            from,
            periodType: patch.periodType ?? periodType,
            periodStart: patch.periodStart ?? periodStartKey,
          },
        },
        undefined,
        { shallow: true }
      )
    },
    [from, leaderId, periodStartKey, periodType, router]
  )

  const changePeriodType = useCallback(
    (nextType: PersonalSchedulePeriodType) => {
      if (nextType === periodType) return

      updateQuery({
        periodType: nextType,
        periodStart: normalizePeriodStart(nextType, periodStartKey),
      })
    },
    [periodStartKey, periodType, updateQuery]
  )

  const goToPreviousPeriod = useCallback(() => {
    const unit = periodType === "month" ? "month" : "week"
    const nextStart = dayjs(periodStartKey).subtract(1, unit)
    updateQuery({ periodStart: normalizePeriodStart(periodType, nextStart.format("YYYY-MM-DD")) })
  }, [periodStartKey, periodType, updateQuery])

  const goToNextPeriod = useCallback(() => {
    const unit = periodType === "month" ? "month" : "week"
    const nextStart = dayjs(periodStartKey).add(1, unit)
    updateQuery({ periodStart: normalizePeriodStart(periodType, nextStart.format("YYYY-MM-DD")) })
  }, [periodStartKey, periodType, updateQuery])

  const pickPeriod = useCallback(
    (date: Dayjs | null) => {
      if (!date) return
      updateQuery({ periodStart: normalizePeriodStart(periodType, date.format("YYYY-MM-DD")) })
    },
    [periodType, updateQuery]
  )

  return {
    leader,
    profile,
    rows: schedule.rows,
    periodType,
    periodStart: periodStartDate,
    periodEnd: periodEndDate,
    from,
    changePeriodType,
    goToPreviousPeriod,
    goToNextPeriod,
    pickPeriod,
  }
}
