export const CONFIG_KEY = {
  USER_SESSION_TIMEOUT: "USER_SESSION_TIMEOUT",
  LECTURER_DEADLINE_CRON_SCHEDULE: "LECTURER_DEADLINE_CRON_SCHEDULE",
} as const

export * from "./libs"
export * from "./lecturer-deadline-cron-schedule"
