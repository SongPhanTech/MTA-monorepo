import { useScheduleTypeFilter } from "@hooks/use-schedule-type-filter"
import {
  MOCK_MONTH_REFERENCE,
  MOCK_MONTH_SCHEDULE_ENTRIES,
} from "@constants/work-schedule-month-mock"
import { WEEK_SCHEDULE_LEADERS } from "@constants/work-schedule-week-mock"
import { getMonthDays, getMonthRange } from "@/utils/work-schedule-month"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

const DEFAULT_MONTH_OFFSET = dayjs(MOCK_MONTH_REFERENCE)
  .startOf("month")
  .diff(dayjs().startOf("month"), "month")

export function useMonthScheduleView() {
  const [monthOffset, setMonthOffset] = useState(DEFAULT_MONTH_OFFSET)

  const { monthStart, monthEnd } = useMemo(() => getMonthRange(monthOffset), [monthOffset])

  const leaders = useMemo(
    () => [...WEEK_SCHEDULE_LEADERS].sort((a, b) => a.sortOrder - b.sortOrder),
    []
  )

  const monthDays = useMemo(() => getMonthDays(monthStart), [monthStart])

  const entries = useMemo(() => {
    const monthKey = dayjs(monthStart).format("YYYY-MM")

    return MOCK_MONTH_SCHEDULE_ENTRIES.filter((entry) => entry.date.startsWith(monthKey)).map(
      (entry) => ({
        ...entry,
        publishStatus: entry.publishStatus ?? "PUBLISHED",
      })
    )
  }, [monthStart])

  const { hiddenTypes, toggleType, filteredEntries, entriesByCell } = useScheduleTypeFilter(entries)

  const eventCount = filteredEntries.length

  const goToPreviousMonth = useCallback(() => {
    setMonthOffset((current) => current - 1)
  }, [])

  const goToNextMonth = useCallback(() => {
    setMonthOffset((current) => current + 1)
  }, [])

  const goToCurrentMonth = useCallback(() => {
    setMonthOffset(0)
  }, [])

  const pickMonth = useCallback((offset: number) => {
    setMonthOffset(offset)
  }, [])

  return {
    monthStart,
    monthEnd,
    monthOffset,
    monthDays,
    leaders,
    entriesByCell,
    eventCount,
    hiddenTypes,
    toggleType,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    pickMonth,
  }
}
