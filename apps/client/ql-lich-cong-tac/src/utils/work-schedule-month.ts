import dayjs from "dayjs"
import { formatWeekdayLabel } from "@/utils/work-schedule-week"

export function getMonthRange(monthOffset = 0) {
  const monthStart = dayjs().add(monthOffset, "month").startOf("month")
  const monthEnd = monthStart.endOf("month")

  return {
    monthStart: monthStart.toDate(),
    monthEnd: monthEnd.toDate(),
    monthOffset,
  }
}

export function getMonthDays(monthStart: Date) {
  const start = dayjs(monthStart).startOf("month")
  const daysInMonth = start.daysInMonth()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = start.add(index, "day")

    return {
      key: date.format("YYYY-MM-DD"),
      weekdayLabel: formatWeekdayLabel(date),
      dateLabel: date.format("DD/MM"),
      dayNumber: date.date(),
      isToday: date.isSame(dayjs(), "day"),
      isWeekend: date.day() === 0 || date.day() === 6,
    }
  })
}

export function formatMonthLabel(monthStart: Date) {
  const date = dayjs(monthStart)
  return `Tháng ${date.month() + 1} năm ${date.year()}`
}

export function formatMonthPeriodLabel(monthStart: Date, monthEnd: Date) {
  const start = dayjs(monthStart)
  const end = dayjs(monthEnd)
  return `Từ ngày ${start.format("DD/MM/YYYY")} đến ${end.format("DD/MM/YYYY")}`
}
