export type WorkScheduleEventType = "HOP" | "LAM_VIEC" | "TIEP_KHACH" | "CONG_TAC" | "KHAC"

export type WorkScheduleParticipant = {
  id: string
  fullName: string
  department: string
}

export type WorkScheduleHostUnit = {
  id: string
  name: string
}

export type WorkScheduleParticipantRole = {
  id: string
  name: string
}

export type WorkSchedulePreviewEvent = {
  id: string
  date: string
  startTime: string
  endTime: string
  type: WorkScheduleEventType
  title: string
  location: string
  participantCount: number
  leaderId?: string
  isDraft?: boolean
}

export type WorkScheduleFormValues = {
  leaderId: string
  eventType: WorkScheduleEventType
  date: string
  startTime: string
  endTime: string
  content: string
  location: string
  hostUnitId: string
  participantIds: string[]
  participantRoleId: string
}

export type WorkScheduleEventTypeMeta = {
  value: WorkScheduleEventType
  label: string
  color: string
  background: string
}
