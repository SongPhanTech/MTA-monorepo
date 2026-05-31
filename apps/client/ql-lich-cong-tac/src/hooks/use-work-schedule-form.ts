import {
  DEFAULT_WORK_SCHEDULE_FORM_VALUES,
  MOCK_PREVIEW_EVENTS,
} from "@constants/work-schedule-form-mock"
import { WORK_SCHEDULE_LEADERS } from "@constants/work-schedule-leaders"
import type { WorkScheduleFormValues, WorkSchedulePreviewEvent } from "@/types/work-schedule-form"
import {
  detectWorkScheduleConflicts,
  type WorkScheduleConflict,
  type WorkScheduleValidationError,
  validateWorkScheduleForm,
} from "@/utils/work-schedule-validation"
import { message } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useCallback, useMemo, useState } from "react"

const DRAFT_EVENT_ID = "preview-draft"

function formValuesToPreviewEvent(values: WorkScheduleFormValues): WorkSchedulePreviewEvent {
  return {
    id: DRAFT_EVENT_ID,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    type: values.eventType,
    title: values.content || "Chưa có nội dung",
    location: values.location || "Chưa có địa điểm",
    participantCount: values.participantIds.length,
    leaderId: values.leaderId,
    isDraft: true,
  }
}

function mergePreviewEvents(
  events: WorkSchedulePreviewEvent[],
  draftEvent: WorkSchedulePreviewEvent
) {
  const sameDayEvents = events.filter((event) => {
    if (event.date !== draftEvent.date) return false
    if (event.id === DRAFT_EVENT_ID || event.id === "preview-1") return false
    return true
  })

  return [...sameDayEvents, draftEvent].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )
}

function showValidationErrors(errors: WorkScheduleValidationError[]) {
  message.error(errors[0]?.message ?? "Vui lòng kiểm tra lại thông tin")
}

function showConflictWarnings(conflicts: WorkScheduleConflict[]) {
  message.warning(conflicts[0]?.message ?? "Phát hiện xung đột lịch")
}

export function useWorkScheduleForm() {
  const [formValues, setFormValues] = useState<WorkScheduleFormValues>(
    DEFAULT_WORK_SCHEDULE_FORM_VALUES
  )
  const [savedEvents, setSavedEvents] = useState<WorkSchedulePreviewEvent[]>(MOCK_PREVIEW_EVENTS)
  const [previewDate, setPreviewDate] = useState<Dayjs>(() =>
    dayjs(DEFAULT_WORK_SCHEDULE_FORM_VALUES.date)
  )
  const [validationErrors, setValidationErrors] = useState<WorkScheduleValidationError[]>([])
  const [conflicts, setConflicts] = useState<WorkScheduleConflict[]>([])

  const leaders = useMemo(
    () =>
      [...WORK_SCHEDULE_LEADERS]
        .filter((leader) => leader.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    []
  )

  const draftEvent = useMemo(() => formValuesToPreviewEvent(formValues), [formValues])

  const previewEvents = useMemo(() => {
    const baseEvents = savedEvents.filter((event) => event.id !== DRAFT_EVENT_ID)
    if (formValues.date !== previewDate.format("YYYY-MM-DD")) {
      return baseEvents
        .filter((event) => event.date === previewDate.format("YYYY-MM-DD"))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    return mergePreviewEvents(baseEvents, draftEvent).filter(
      (event) => event.date === previewDate.format("YYYY-MM-DD")
    )
  }, [draftEvent, formValues.date, previewDate, savedEvents])

  const liveConflicts = useMemo(
    () => detectWorkScheduleConflicts(formValues, savedEvents),
    [formValues, savedEvents]
  )

  const updateFormValues = useCallback((patch: Partial<WorkScheduleFormValues>) => {
    setFormValues((current) => {
      const next = { ...current, ...patch }
      setConflicts(detectWorkScheduleConflicts(next, savedEvents))
      return next
    })
  }, [savedEvents])

  const resetForm = useCallback(() => {
    setFormValues({
      ...DEFAULT_WORK_SCHEDULE_FORM_VALUES,
      date: previewDate.format("YYYY-MM-DD"),
      leaderId: formValues.leaderId,
    })
    setValidationErrors([])
    setConflicts([])
  }, [formValues.leaderId, previewDate])

  const validateBeforeSave = useCallback(
    (allowConflicts = false) => {
      const errors = validateWorkScheduleForm(formValues)
      const nextConflicts = detectWorkScheduleConflicts(formValues, savedEvents)

      setValidationErrors(errors)
      setConflicts(nextConflicts)

      if (errors.length > 0) {
        showValidationErrors(errors)
        return false
      }

      if (!allowConflicts && nextConflicts.length > 0) {
        showConflictWarnings(nextConflicts)
        return false
      }

      return true
    },
    [formValues, savedEvents]
  )

  const saveDraft = useCallback(() => {
    if (!validateBeforeSave(true)) return

    setSavedEvents((current) => {
      const others = current.filter((event) => event.id !== DRAFT_EVENT_ID)
      return [...others, { ...draftEvent, isDraft: true }]
    })
    setConflicts([])
    message.success("Đã lưu nháp lịch công tác")
  }, [draftEvent, validateBeforeSave])

  const saveAndAddNew = useCallback(() => {
    if (!validateBeforeSave()) return

    setSavedEvents((current) => {
      const others = current.filter((event) => event.id !== DRAFT_EVENT_ID)
      return [...others, { ...draftEvent, id: `saved-${Date.now()}`, isDraft: false }]
    })
    message.success("Đã lưu lịch công tác, sẵn sàng thêm mới")
    resetForm()
  }, [draftEvent, resetForm, validateBeforeSave])

  const saveAndPublish = useCallback(() => {
    if (!validateBeforeSave()) return

    setSavedEvents((current) => {
      const others = current.filter((event) => event.id !== DRAFT_EVENT_ID)
      return [...others, { ...draftEvent, id: `published-${Date.now()}`, isDraft: false }]
    })
    message.success("Đã lưu và công bố lịch công tác")
  }, [draftEvent, validateBeforeSave])

  const goToPreviousDay = useCallback(() => {
    setPreviewDate((current) => {
      const nextDate = current.subtract(1, "day")
      setFormValues((values) => ({ ...values, date: nextDate.format("YYYY-MM-DD") }))
      return nextDate
    })
  }, [])

  const goToNextDay = useCallback(() => {
    setPreviewDate((current) => {
      const nextDate = current.add(1, "day")
      setFormValues((values) => ({ ...values, date: nextDate.format("YYYY-MM-DD") }))
      return nextDate
    })
  }, [])

  const goToToday = useCallback(() => {
    const today = dayjs()
    setPreviewDate(today)
    updateFormValues({ date: today.format("YYYY-MM-DD") })
  }, [updateFormValues])

  const selectPreviewDate = useCallback(
    (date: Dayjs | null) => {
      if (!date) return
      setPreviewDate(date)
      updateFormValues({ date: date.format("YYYY-MM-DD") })
    },
    [updateFormValues]
  )

  return {
    leaders,
    formValues,
    previewDate,
    previewEvents,
    validationErrors,
    conflicts: conflicts.length > 0 ? conflicts : liveConflicts,
    updateFormValues,
    resetForm,
    saveDraft,
    saveAndAddNew,
    saveAndPublish,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    selectPreviewDate,
  }
}
