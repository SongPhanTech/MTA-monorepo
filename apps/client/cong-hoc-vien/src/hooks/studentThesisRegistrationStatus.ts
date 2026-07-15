import { StudentThesisRegistrationStatus } from "@workspace/db/client"

export type StudentThesisRegistrationStatusOption = {
  value: StudentThesisRegistrationStatus
  label: string
  color?: string
}

export const useStudentThesisRegistrationStatusOptions = () => {
  const statusOptions: StudentThesisRegistrationStatusOption[] = [
    { value: StudentThesisRegistrationStatus.PENDING, label: "Chờ duyệt", color: "blue" },
    { value: StudentThesisRegistrationStatus.ACCEPTED, label: "Đã chấp nhận", color: "green" },
    { value: StudentThesisRegistrationStatus.REJECTED, label: "Đã từ chối", color: "red" },
    { value: StudentThesisRegistrationStatus.CANCELED, label: "Đã hủy", color: "volcano" },
  ]

  const getStudentThesisRegistrationStatusLabel = (
    value: StudentThesisRegistrationStatus | null | undefined
  ): string => {
    return statusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getStudentThesisRegistrationStatusColor = (
    value: StudentThesisRegistrationStatus | null | undefined
  ): string => {
    return statusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    statusOptions,
    getStudentThesisRegistrationStatusLabel,
    getStudentThesisRegistrationStatusColor,
  }
}
