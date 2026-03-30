import { DecisionStatus } from "@workspace/db/client"

export type DecisionStatusOption = {
  value: DecisionStatus
  label: string
  color: string
}

export const useDecisionStatusOptions = () => {
  const options: DecisionStatusOption[] = [
    { value: DecisionStatus.PENDING, label: "Đang chờ duyệt", color: "orange" },
    { value: DecisionStatus.APPROVED, label: "Đã duyệt", color: "green" },
    { value: DecisionStatus.REJECTED, label: "Bị từ chối", color: "red" },
    { value: DecisionStatus.APPEALED, label: "Đang khiếu nại", color: "blue" },
  ]

  const getDecisionStatusLabel = (value: DecisionStatus | null | undefined): string => {
    if (!value) return ""
    return options.find((opt) => opt.value === value)?.label || ""
  }

  const getDecisionStatusColor = (value: DecisionStatus | null | undefined): string => {
    if (!value) return "default"
    return options.find((opt) => opt.value === value)?.color || "default"
  }

  return { options, getDecisionStatusLabel, getDecisionStatusColor }
}
