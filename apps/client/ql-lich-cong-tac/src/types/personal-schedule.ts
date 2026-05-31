export type LeaderPersonalProfile = {
  phone: string
  email: string
  notes: string[]
}

export type PersonalScheduleDayRow = {
  key: string
  date: string
  dayLabel: string
  time?: string
  content?: string
  location?: string
  note?: string
}

export type PersonalSchedulePeriodType = "week" | "month"
