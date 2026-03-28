import { SubjectClassStatus } from "@workspace/db/client"

export type SubjectClassStatusOption = {
  value: SubjectClassStatus
  label: string
  color: string
}

export const useSubjectClassStatusOptions = () => {
  const options: SubjectClassStatusOption[] = [
    { value: SubjectClassStatus.DRAFT, label: "Nháp", color: "default" },
    { value: SubjectClassStatus.OFFICIAL, label: "Giảng dạy", color: "success" },
  ]

  const getSubjectClassStatusLabel = (value: SubjectClassStatus | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  const getSubjectClassStatusColor = (value: SubjectClassStatus | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    options,
    getSubjectClassStatusLabel,
    getSubjectClassStatusColor,
  }
}
