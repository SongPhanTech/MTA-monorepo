import { SubjectClassSchedule } from "@workspace/db/client"

export type ScheduleOption = {
  value: SubjectClassSchedule
  label: string
}

export const useScheduleOptions = () => {
  const scheduleOptions: ScheduleOption[] = [
    { value: SubjectClassSchedule.MORNING, label: "Sáng" },
    { value: SubjectClassSchedule.AFTERNOON, label: "Chiều" },
    { value: SubjectClassSchedule.EVENING, label: "Tối" },
  ]

  const getScheduleLabel = (value: SubjectClassSchedule | null | undefined): string => {
    return scheduleOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    scheduleOptions,
    getScheduleLabel,
  }
}
