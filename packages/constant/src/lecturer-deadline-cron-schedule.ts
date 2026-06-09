export const LECTURER_DEADLINE_CRON_TIMEZONE = "Asia/Ho_Chi_Minh"

export type LecturerDeadlineCronSchedule = {
  enabled: boolean
  /** Giờ chạy trong ngày (0–23), múi giờ `timezone`. */
  hours: number[]
  timezone: string
}

export const DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE: LecturerDeadlineCronSchedule = {
  enabled: true,
  hours: [0, 12],
  timezone: LECTURER_DEADLINE_CRON_TIMEZONE,
}

const chuanHoaGio = (hours: unknown): number[] => {
  if (!Array.isArray(hours)) return []

  const hopLe = hours
    .map((h) => (typeof h === "number" ? h : Number(h)))
    .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23)

  return [...new Set(hopLe)].sort((a, b) => a - b)
}

export const parseLecturerDeadlineCronSchedule = (
  raw: string | null | undefined
): LecturerDeadlineCronSchedule => {
  if (!raw?.trim()) return { ...DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE }

  try {
    const parsed = JSON.parse(raw) as Partial<LecturerDeadlineCronSchedule>
    const hours = chuanHoaGio(parsed.hours)

    return {
      enabled: parsed.enabled !== false,
      hours: hours.length ? hours : [...DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE.hours],
      timezone:
        typeof parsed.timezone === "string" && parsed.timezone.trim()
          ? parsed.timezone.trim()
          : LECTURER_DEADLINE_CRON_TIMEZONE,
    }
  } catch {
    return { ...DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE }
  }
}

export const stringifyLecturerDeadlineCronSchedule = (
  schedule: LecturerDeadlineCronSchedule
): string =>
  JSON.stringify({
    enabled: schedule.enabled,
    hours: chuanHoaGio(schedule.hours),
    timezone: schedule.timezone?.trim() || LECTURER_DEADLINE_CRON_TIMEZONE,
  })
