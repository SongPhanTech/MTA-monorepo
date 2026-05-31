import {
  MOCK_WEEK_SCHEDULE_ENTRIES,
  MOCK_WEEK_START,
  WEEK_SCHEDULE_LEADERS,
} from "@constants/work-schedule-week-mock"
import { useScheduleTypeFilter } from "@hooks/use-schedule-type-filter"
import { getWeekDays, getWeekRange } from "@/utils/work-schedule-week"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

const DEFAULT_WEEK_OFFSET = dayjs(MOCK_WEEK_START)
  .startOf("isoWeek")
  .diff(dayjs().startOf("isoWeek"), "week")

export function useWeekScheduleView() {
  const [weekOffset, setWeekOffset] = useState(DEFAULT_WEEK_OFFSET)

  const { weekStart, weekEnd } = useMemo(() => getWeekRange(weekOffset), [weekOffset])

  const leaders = useMemo(
    () => [...WEEK_SCHEDULE_LEADERS].sort((a, b) => a.sortOrder - b.sortOrder),
    []
  )

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const entries = useMemo(() => {
    const weekStartKey = dayjs(weekStart).format("YYYY-MM-DD")
    const weekEndKey = dayjs(weekEnd).format("YYYY-MM-DD")

    return MOCK_WEEK_SCHEDULE_ENTRIES.filter(
      (entry) => entry.date >= weekStartKey && entry.date <= weekEndKey
    ).map((entry) => ({
      ...entry,
      publishStatus: entry.publishStatus ?? "PUBLISHED",
    }))
  }, [weekEnd, weekStart])

  const { hiddenTypes, toggleType, entriesByCell } = useScheduleTypeFilter(entries)

  const goToPreviousWeek = useCallback(() => {
    setWeekOffset((current) => current - 1)
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekOffset((current) => current + 1)
  }, [])

  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0)
  }, [])

  const goToMockWeek = useCallback(() => {
    setWeekOffset(DEFAULT_WEEK_OFFSET)
  }, [])

  const pickWeek = useCallback((offset: number) => {
    setWeekOffset(offset)
  }, [])

  return {
    weekStart,
    weekEnd,
    weekOffset,
    weekDays,
    leaders,
    entries,
    entriesByCell,
    hiddenTypes,
    toggleType,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToMockWeek,
    pickWeek,
  }
}
