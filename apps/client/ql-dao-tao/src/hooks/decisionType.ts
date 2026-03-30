import { DecisionType } from "@workspace/db/client"

export type DecisionTypeOption = {
  value: DecisionType
  label: string
  color?: string
}

export const useDecisionTypeOptions = () => {
  const decisionTypeOptions: DecisionTypeOption[] = [
    {
      value: DecisionType.SUPERVISION_GUIDE,
      label: "Quyết định Hướng dẫn",
      color: "blue",
    },
    {
      value: DecisionType.EVALUATION_COUNCIL,
      label: "Quyết định Thành lập Hội đồng",
      color: "green",
    },
  ]

  const getDecisionTypeLabel = (value: DecisionType | null | undefined): string => {
    return decisionTypeOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getDecisionTypeColor = (value: DecisionType | null | undefined): string => {
    return decisionTypeOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    decisionTypeOptions,
    getDecisionTypeLabel,
    getDecisionTypeColor,
  }
}
