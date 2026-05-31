export type WorkScheduleLeader = {
  id: string
  rankTitle: string
  fullName: string
  sortOrder: number
  active: boolean
  userProfileId?: string | null
  showOnDisplay?: boolean
}

export type WorkScheduleEventItem = {
  id: string
  leaderId: string
  classDate: Date
  startTime?: Date | null
  endTime?: Date | null
  content: string
  location?: string | null
}

export type WeekRange = {
  weekStart: Date
  weekEnd: Date
  weekOffset: number
}
