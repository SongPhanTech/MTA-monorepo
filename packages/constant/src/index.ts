export const CONFIG_KEY = {
  USER_SESSION_TIMEOUT: "USER_SESSION_TIMEOUT",
  LECTURER_DEADLINE_CRON_SCHEDULE: "LECTURER_DEADLINE_CRON_SCHEDULE",
} as const

export const STORAGE_KEY = {
  /** Kiểu hiển thị lịch công tác: "calendar" | "table" */
  VIEW_CALENDAR_TYPE: "view_calendar_type",
} as const

export * from "./libs"
export * from "./lecturer-deadline-cron-schedule"
export * from "./table-names"
