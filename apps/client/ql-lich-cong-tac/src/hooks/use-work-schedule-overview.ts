import { WORK_SCHEDULE_LEADERS } from "@constants/work-schedule-leaders"
import { useFindManyClassSchedule } from "@workspace/db/hooks"
import dayjs from "dayjs"
import { useMemo } from "react"
import type { WorkScheduleEventItem, WorkScheduleLeader } from "@/types/work-schedule"
import {
  formatEventTime,
  formatMonthPeriodLabel,
  formatQuarterPeriodLabel,
  formatTodayPeriodLabel,
  formatUpcomingDaysPeriodLabel,
  formatWeekPeriodLabel,
  getEventDateTime,
  getQuarterRange,
  isInCurrentMonth,
  isInCurrentQuarter,
  isInCurrentWeek,
  isToday,
  isUpcomingWithinDays,
} from "@/utils/work-schedule-week"

function buildDemoEvents(leaders: WorkScheduleLeader[]): WorkScheduleEventItem[] {
  if (leaders.length === 0) return []

  const now = dayjs()
  const monday = now.startOf("isoWeek")

  const templates = [
    { dayOffset: 0, hour: 8, content: "Họp Hội đồng", location: "P405 – S1", leaderIndex: 0 },
    {
      dayOffset: 1,
      hour: 7,
      minute: 30,
      content: "Giao ban BTTM",
      location: "P405 – S1",
      leaderIndex: 0,
    },
    {
      dayOffset: 1,
      hour: 14,
      content: "Làm việc với đơn vị",
      location: "Hội trường A",
      leaderIndex: 1,
    },
    {
      dayOffset: 3,
      hour: 9,
      content: "Kiểm tra công tác tuần",
      location: "VP Học viện",
      leaderIndex: 2,
    },
    { dayOffset: 5, hour: 10, content: "Họp Ban Giám đốc", location: "P301", leaderIndex: 0 },
    {
      dayOffset: 10,
      hour: 15,
      content: "Tổng kết tháng",
      location: "Hội trường lớn",
      leaderIndex: 1,
    },
    { dayOffset: 20, hour: 8, content: "Hội nghị quý", location: "P501", leaderIndex: 2 },
    { dayOffset: 2, hour: 16, content: "Tiếp công dân", location: "VP Học viện", leaderIndex: 3 },
  ]

  return templates
    .map((item, index) => {
      const leader = leaders[item.leaderIndex]
      if (!leader) return null

      const date = monday.add(item.dayOffset, "day")
      const startTime = date
        .hour(item.hour)
        .minute(item.minute ?? 0)
        .second(0)

      return {
        id: `demo-${index + 1}`,
        leaderId: leader.id,
        classDate: date.startOf("day").toDate(),
        startTime: startTime.toDate(),
        endTime: startTime.add(90, "minute").toDate(),
        content: item.content,
        location: item.location,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

function mapClassScheduleToEvents(
  schedules: Array<{
    id: string
    classDate: Date
    startTime: Date | null
    endTime: Date | null
    notes: string | null
    location: string | null
    userProfiles?: Array<{ id: string }> | null
  }>,
  leaders: WorkScheduleLeader[]
): WorkScheduleEventItem[] {
  const leaderByProfile = new Map(
    leaders
      .filter((leader) => leader.userProfileId)
      .map((leader) => [leader.userProfileId as string, leader.id])
  )

  return schedules.flatMap((schedule) => {
    const profileIds = schedule.userProfiles?.map((profile) => profile.id).filter(Boolean) ?? []
    const leaderId =
      profileIds.map((profileId) => leaderByProfile.get(profileId)).find(Boolean) ?? leaders[0]?.id

    if (!leaderId) return []

    return [
      {
        id: schedule.id,
        leaderId,
        classDate: schedule.classDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        content: schedule.notes ?? "Không có nội dung",
        location: schedule.location,
      },
    ]
  })
}

export type WorkScheduleTodayEvent = {
  id: string
  timeLabel: string
  content: string
  leaderLabel: string
  location?: string | null
}

export type WorkScheduleOverviewStats = {
  todayEventCount: number
  todayPeriodLabel: string
  weekEventCount: number
  weekPeriodLabel: string
  monthEventCount: number
  monthPeriodLabel: string
  quarterEventCount: number
  quarterPeriodLabel: string
  upcoming7DaysEventCount: number
  upcoming7DaysPeriodLabel: string
}

export function useWorkScheduleOverview() {
  const { quarterStart, quarterEnd } = useMemo(() => getQuarterRange(), [])

  const leaders = useMemo(
    () =>
      [...WORK_SCHEDULE_LEADERS]
        .filter((leader) => leader.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    []
  )

  const { data: schedules = [], isLoading } = useFindManyClassSchedule({
    where: {
      periodType: "WEEK",
      deletedAt: null,
      classDate: {
        gte: quarterStart,
        lte: quarterEnd,
      },
    },
    include: {
      userProfiles: {
        select: {
          id: true,
          fullname: true,
        },
      },
    },
  })

  const events = useMemo(() => {
    const apiEvents = mapClassScheduleToEvents(schedules, leaders)
    if (apiEvents.length > 0) return apiEvents
    return buildDemoEvents(leaders)
  }, [schedules, leaders])

  const stats = useMemo<WorkScheduleOverviewStats>(() => {
    const reference = dayjs()
    return {
      todayEventCount: events.filter((event) => isToday(event, reference)).length,
      todayPeriodLabel: formatTodayPeriodLabel(reference),
      weekEventCount: events.filter((event) => isInCurrentWeek(event, reference)).length,
      weekPeriodLabel: formatWeekPeriodLabel(reference),
      monthEventCount: events.filter((event) => isInCurrentMonth(event, reference)).length,
      monthPeriodLabel: formatMonthPeriodLabel(reference),
      quarterEventCount: events.filter((event) => isInCurrentQuarter(event, reference)).length,
      quarterPeriodLabel: formatQuarterPeriodLabel(reference),
      upcoming7DaysEventCount: events.filter((event) => isUpcomingWithinDays(event, 7, reference))
        .length,
      upcoming7DaysPeriodLabel: formatUpcomingDaysPeriodLabel(7, reference),
    }
  }, [events])

  const todayUpcomingEvents = useMemo<WorkScheduleTodayEvent[]>(() => {
    const reference = dayjs()

    return events
      .filter((event) => isToday(event, reference))
      .sort((left, right) => getEventDateTime(left).valueOf() - getEventDateTime(right).valueOf())
      .slice(0, 5)
      .map((event) => {
        const leader = leaders.find((item) => item.id === event.leaderId)

        return {
          id: event.id,
          timeLabel: formatEventTime(event.startTime, event.endTime) || "Cả ngày",
          content: event.content,
          leaderLabel: leader ? `${leader.rankTitle} ${leader.fullName}` : "—",
          location: event.location,
        }
      })
  }, [events, leaders])

  return {
    events,
    stats,
    todayUpcomingEvents,
    isLoading,
  }
}
