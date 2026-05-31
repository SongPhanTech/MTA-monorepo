import { MOCK_MONTH_SCHEDULE_ENTRIES } from "@constants/work-schedule-month-mock"
import {
  MOCK_WEEK_SCHEDULE_ENTRIES,
  WEEK_SCHEDULE_LEADERS,
} from "@constants/work-schedule-week-mock"
import type { LeaderPersonalProfile, PersonalScheduleDayRow } from "@/types/personal-schedule"
import type { WeekScheduleEntry } from "@/types/work-schedule-week-view"
import { getMonthDays } from "@/utils/work-schedule-month"
import { formatWorkDayLabel, getWeekDays } from "@/utils/work-schedule-week"
import dayjs from "dayjs"

export const LEADER_PERSONAL_PROFILES: Record<string, LeaderPersonalProfile> = {
  "w-leader-1": {
    phone: "0912345678",
    email: "thai.le@hvktqs.mil.vn",
    notes: [
      "Lịch có thể thay đổi, cập nhật thường xuyên",
      "Vui lòng kiểm tra trước khi tham gia",
    ],
  },
  "w-leader-2": {
    phone: "0923456789",
    email: "thuong.tran@hvktqs.mil.vn",
    notes: [
      "Lịch có thể thay đổi, cập nhật thường xuyên",
      "Vui lòng kiểm tra trước khi tham gia",
    ],
  },
  "w-leader-3": {
    phone: "0987643456",
    email: "nam@gmail.com",
    notes: [
      "Lịch có thể thay đổi, cập nhật thường xuyên",
      "Vui lòng kiểm tra trước khi tham gia",
    ],
  },
  "w-leader-4": {
    phone: "0934567890",
    email: "huy.mai@hvktqs.mil.vn",
    notes: [
      "Lịch có thể thay đổi, cập nhật thường xuyên",
      "Vui lòng kiểm tra trước khi tham gia",
    ],
  },
}

function splitEntryContent(content: string) {
  const locationMatch = content.match(/\(([^)]+)\)\s*$/)
  if (!locationMatch) {
    return { content, location: "" }
  }

  return {
    content: content.replace(/\s*\([^)]+\)\s*$/, "").trim(),
    location: locationMatch[1]?.trim() ?? "",
  }
}

function mapEntryToRowFields(entry: WeekScheduleEntry) {
  const parsed = splitEntryContent(entry.content)

  return {
    time: entry.time ?? "",
    content: parsed.content,
    location: parsed.location,
    note: entry.type === "SUPPLEMENT" ? "Lịch bổ sung/phát sinh" : "",
  }
}

type ScheduleDayRef = {
  key: string
}

function buildDayRows(
  leaderId: string,
  days: ScheduleDayRef[],
  entries: WeekScheduleEntry[]
): PersonalScheduleDayRow[] {
  return days.map((day) => {
    const dayEntries = entries
      .filter((entry) => entry.leaderId === leaderId && entry.date === day.key)
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))

    const primary = dayEntries[0]
    const fields = primary ? mapEntryToRowFields(primary) : null

    return {
      key: day.key,
      date: day.key,
      dayLabel: formatWorkDayLabel(day.key),
      time: fields?.time,
      content: fields?.content,
      location: fields?.location,
      note: fields?.note,
    }
  })
}

export function getLeaderById(leaderId: string) {
  return WEEK_SCHEDULE_LEADERS.find((leader) => leader.id === leaderId)
}

export function getLeaderProfile(leaderId: string): LeaderPersonalProfile {
  return (
    LEADER_PERSONAL_PROFILES[leaderId] ?? {
      phone: "—",
      email: "—",
      notes: ["Lịch có thể thay đổi, cập nhật thường xuyên"],
    }
  )
}

export function getPersonalWeekScheduleRows(leaderId: string, weekStart: string) {
  const weekStartDate = dayjs(weekStart).startOf("isoWeek").toDate()
  const days = getWeekDays(weekStartDate)
  const weekStartKey = dayjs(weekStartDate).format("YYYY-MM-DD")
  const weekEndKey = dayjs(weekStartDate).endOf("isoWeek").format("YYYY-MM-DD")

  const entries = [...MOCK_WEEK_SCHEDULE_ENTRIES, ...MOCK_MONTH_SCHEDULE_ENTRIES].filter(
    (entry) => entry.date >= weekStartKey && entry.date <= weekEndKey
  )

  return {
    rows: buildDayRows(leaderId, days, entries),
    weekStart: weekStartDate,
    weekEnd: dayjs(weekStartDate).endOf("isoWeek").toDate(),
  }
}

export function getPersonalMonthScheduleRows(leaderId: string, monthStart: string) {
  const monthStartDate = dayjs(monthStart).startOf("month").toDate()
  const days = getMonthDays(monthStartDate)
  const monthKey = dayjs(monthStartDate).format("YYYY-MM")

  const entries = MOCK_MONTH_SCHEDULE_ENTRIES.filter(
    (entry) => entry.leaderId === leaderId && entry.date.startsWith(monthKey)
  )

  return {
    rows: buildDayRows(leaderId, days, entries),
    monthStart: monthStartDate,
    monthEnd: dayjs(monthStartDate).endOf("month").toDate(),
  }
}
