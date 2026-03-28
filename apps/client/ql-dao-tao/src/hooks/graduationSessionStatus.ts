import { GraduationSessionStatus } from "@workspace/db/client"

export type GraduationSessionStatusOption = {
  value: GraduationSessionStatus
  label: string
  color?: string
}

export const useGraduationSessionStatusOptions = () => {
  const graduationSessionStatusOptions: GraduationSessionStatusOption[] = [
    { value: GraduationSessionStatus.PLANNING, label: "Đang lên kế hoạch", color: "blue" },
    {
      value: GraduationSessionStatus.OPEN_FOR_APPLICATION,
      label: "Đang mở nhận đơn",
      color: "green",
    },
    {
      value: GraduationSessionStatus.IN_REVIEW,
      label: "Đang trong quá trình xét duyệt",
      color: "orange",
    },
    { value: GraduationSessionStatus.COMPLETED, label: "Đã hoàn tất", color: "gold" },
    { value: GraduationSessionStatus.CLOSED, label: "Đã đóng", color: "red" },
  ]

  const getGraduationSessionStatusLabel = (
    value: GraduationSessionStatus | null | undefined
  ): string => {
    return graduationSessionStatusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getGraduationSessionStatusColor = (
    value: GraduationSessionStatus | null | undefined
  ): string => {
    return graduationSessionStatusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    graduationSessionStatusOptions,
    getGraduationSessionStatusLabel,
    getGraduationSessionStatusColor,
  }
}
