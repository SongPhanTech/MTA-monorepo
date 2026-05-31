import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import type { WorkScheduleEventItem } from "@/types/work-schedule"
import type { WeekRange } from "@/types/work-schedule"

dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)

const DAY_LABELS = ["HAI", "BA", "TƯ", "NĂM", "SÁU", "BẢY", "CN"] as const

export function getWeekRange(weekOffset = 0): WeekRange {
  const monday = dayjs().startOf("isoWeek").add(weekOffset, "week")
  const sunday = monday.endOf("isoWeek")
  return {
    weekStart: monday.startOf("day").toDate(),
    weekEnd: sunday.endOf("day").toDate(),
    weekOffset,
  }
}

export function getQuarterRange(reference = dayjs()) {
  return {
    quarterStart: reference.startOf("quarter").toDate(),
    quarterEnd: reference.endOf("quarter").toDate(),
  }
}

export function getEventDateTime(event: WorkScheduleEventItem) {
  if (event.startTime) return dayjs(event.startTime)
  return dayjs(event.classDate).startOf("day")
}

export function isInCurrentWeek(event: WorkScheduleEventItem, reference = dayjs()) {
  const date = dayjs(event.classDate)
  return date.isSame(reference, "isoWeek")
}

export function isInCurrentMonth(event: WorkScheduleEventItem, reference = dayjs()) {
  return dayjs(event.classDate).isSame(reference, "month")
}

export function isInCurrentQuarter(event: WorkScheduleEventItem, reference = dayjs()) {
  return dayjs(event.classDate).isSame(reference, "quarter")
}

export function isToday(event: WorkScheduleEventItem, reference = dayjs()) {
  return dayjs(event.classDate).isSame(reference, "day")
}

export function isUpcomingWithinDays(
  event: WorkScheduleEventItem,
  days: number,
  reference = dayjs()
) {
  const eventAt = getEventDateTime(event)
  const endLimit = reference.add(days, "day").endOf("day")
  return !eventAt.isBefore(reference) && !eventAt.isAfter(endLimit)
}

export function getWeekDays(weekStart: Date) {
  const monday = dayjs(weekStart).startOf("day")
  return DAY_LABELS.map((label, index) => {
    const date = monday.add(index, "day")
    return {
      key: date.format("YYYY-MM-DD"),
      label,
      weekdayLabel: formatWeekdayLabel(date),
      date: date.toDate(),
      dayNumber: date.date(),
      dateLabel: date.format("DD/MM"),
      isToday: date.isSame(dayjs(), "day"),
      isWeekend: date.day() === 0 || date.day() === 6,
    }
  })
}

export function formatWeekdayLabel(date: dayjs.Dayjs) {
  if (date.day() === 0) return "Chủ nhật"
  return `Thứ ${date.day() + 1}`
}

export function formatWorkDayLabel(date: dayjs.Dayjs | Date | string) {
  const value = dayjs(date)
  return `${formatWeekdayLabel(value)}, ${value.format("DD/MM/YYYY")}`
}

export function formatWeekRangeLabel(weekStart: Date, weekEnd: Date) {
  const start = dayjs(weekStart)
  const end = dayjs(weekEnd)
  return `Từ ${start.format("DD/MM/YYYY")} đến ${end.format("DD/MM/YYYY")}`
}

export function formatTodayPeriodLabel(reference = dayjs()) {
  return formatWorkDayLabel(reference)
}

export function formatWeekPeriodLabel(reference = dayjs()) {
  const monday = reference.startOf("isoWeek")
  const sunday = reference.endOf("isoWeek")
  return formatWeekRangeLabel(monday.toDate(), sunday.toDate())
}

export function formatMonthPeriodLabel(reference = dayjs()) {
  return `Tháng ${reference.month() + 1} năm ${reference.year()}`
}

export function formatQuarterPeriodLabel(reference = dayjs()) {
  return `Quý ${reference.quarter()} năm ${reference.year()}`
}

export function formatUpcomingDaysPeriodLabel(days: number, reference = dayjs()) {
  const end = reference.add(days, "day")
  return `Từ ${reference.format("DD/MM/YYYY")} đến ${end.format("DD/MM/YYYY")}`
}

export function formatEventTime(startTime?: Date | null, endTime?: Date | null) {
  if (!startTime) return ""
  const start = dayjs(startTime).format("HH:mm")
  if (!endTime) return start
  return `${start} - ${dayjs(endTime).format("HH:mm")}`
}

export function isSameDay(a: Date, b: Date) {
  return dayjs(a).isSame(dayjs(b), "day")
}
