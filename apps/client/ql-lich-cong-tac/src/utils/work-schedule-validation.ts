import type { WorkScheduleFormValues, WorkSchedulePreviewEvent } from "@/types/work-schedule-form"
import dayjs from "dayjs"

export type WorkScheduleValidationError = {
  field: keyof WorkScheduleFormValues | "general"
  message: string
}

export type WorkScheduleConflict = {
  type: "leader_time" | "location_time"
  message: string
  relatedEventId?: string
}

const DRAFT_EVENT_ID = "preview-draft"

function toDateTime(date: string, time: string) {
  return dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm")
}

function rangesOverlap(
  startA: dayjs.Dayjs,
  endA: dayjs.Dayjs,
  startB: dayjs.Dayjs,
  endB: dayjs.Dayjs
) {
  return startA.isBefore(endB) && startB.isBefore(endA)
}

function normalizeLocation(location: string) {
  return location.trim().toLowerCase()
}

export function validateWorkScheduleForm(
  values: WorkScheduleFormValues
): WorkScheduleValidationError[] {
  const errors: WorkScheduleValidationError[] = []

  if (!values.leaderId) {
    errors.push({ field: "leaderId", message: "Vui lòng chọn thủ trưởng" })
  }

  if (!values.content.trim()) {
    errors.push({ field: "content", message: "Vui lòng nhập nội dung công việc" })
  }

  if (!values.location.trim()) {
    errors.push({ field: "location", message: "Vui lòng nhập địa điểm" })
  }

  if (!values.hostUnitId) {
    errors.push({ field: "hostUnitId", message: "Vui lòng chọn đơn vị chủ trì" })
  }

  if (values.participantIds.length === 0) {
    errors.push({
      field: "participantIds",
      message: "Vui lòng chọn ít nhất một thành phần tham dự",
    })
  }

  const startAt = toDateTime(values.date, values.startTime)
  const endAt = toDateTime(values.date, values.endTime)

  if (!startAt.isValid() || !endAt.isValid()) {
    errors.push({ field: "general", message: "Thời gian không hợp lệ" })
    return errors
  }

  if (!endAt.isAfter(startAt)) {
    errors.push({
      field: "endTime",
      message: "Giờ kết thúc phải sau giờ bắt đầu",
    })
  }

  return errors
}

export function detectWorkScheduleConflicts(
  values: WorkScheduleFormValues,
  existingEvents: WorkSchedulePreviewEvent[],
  excludeEventId = DRAFT_EVENT_ID
): WorkScheduleConflict[] {
  const conflicts: WorkScheduleConflict[] = []
  const startAt = toDateTime(values.date, values.startTime)
  const endAt = toDateTime(values.date, values.endTime)

  if (!startAt.isValid() || !endAt.isValid() || !endAt.isAfter(startAt)) {
    return conflicts
  }

  const sameDayEvents = existingEvents.filter(
    (event) => event.date === values.date && event.id !== excludeEventId && event.id !== "preview-1"
  )

  const normalizedLocation = normalizeLocation(values.location)

  for (const event of sameDayEvents) {
    const eventStart = toDateTime(event.date, event.startTime)
    const eventEnd = toDateTime(event.date, event.endTime)

    if (!eventStart.isValid() || !eventEnd.isValid()) continue

    if (event.leaderId === values.leaderId && rangesOverlap(startAt, endAt, eventStart, eventEnd)) {
      conflicts.push({
        type: "leader_time",
        message: `Thủ trưởng đã có lịch trùng giờ (${event.startTime} - ${event.endTime}): ${event.title}`,
        relatedEventId: event.id,
      })
    }

    if (
      normalizedLocation &&
      normalizeLocation(event.location) === normalizedLocation &&
      rangesOverlap(startAt, endAt, eventStart, eventEnd)
    ) {
      conflicts.push({
        type: "location_time",
        message: `Địa điểm trùng giờ với "${event.title}" (${event.startTime} - ${event.endTime})`,
        relatedEventId: event.id,
      })
    }
  }

  return conflicts
}
