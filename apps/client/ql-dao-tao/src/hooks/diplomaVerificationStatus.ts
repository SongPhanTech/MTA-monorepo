import { DiplomaVerificationStatus } from "@workspace/db/client"

export type DiplomaVerificationStatusOption = {
  value: DiplomaVerificationStatus
  label: string
  color?: string
}

export const useDiplomaVerificationStatusOptions = () => {
  const diplomaVerificationStatusOptions: DiplomaVerificationStatusOption[] = [
    { value: DiplomaVerificationStatus.PENDING, label: "Đang chờ xử lý", color: "blue" },
    { value: DiplomaVerificationStatus.IN_PROGRESS, label: "Đang xử lý", color: "orange" },
    { value: DiplomaVerificationStatus.APPROVED, label: "Đã duyệt", color: "green" },
    { value: DiplomaVerificationStatus.REJECTED, label: "Từ chối", color: "red" },
  ]

  const getDiplomaVerificationStatusLabel = (
    value: DiplomaVerificationStatus | null | undefined
  ): string => {
    return diplomaVerificationStatusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getDiplomaVerificationStatusColor = (
    value: DiplomaVerificationStatus | null | undefined
  ): string => {
    return diplomaVerificationStatusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    diplomaVerificationStatusOptions,
    getDiplomaVerificationStatusLabel,
    getDiplomaVerificationStatusColor,
  }
}
