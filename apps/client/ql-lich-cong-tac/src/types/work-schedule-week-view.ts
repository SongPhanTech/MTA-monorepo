export type WeekScheduleEntryType = "ORIGINAL" | "SUPPLEMENT" | "DUTY" | "PARTICIPANT"

export type WeekSchedulePublishStatus = "DRAFT" | "PUBLISHED"

export type WeekScheduleLeader = {
  id: string
  rankTitle: string
  fullName: string
  sortOrder: number
}

export type WeekScheduleEntry = {
  id: string
  leaderId: string
  date: string
  content: string
  time?: string
  location?: string
  type: WeekScheduleEntryType
  publishStatus?: WeekSchedulePublishStatus
}

export type WeekScheduleEntryTypeMeta = {
  type: WeekScheduleEntryType
  label: string
  dotColor: string
  description: string
}
