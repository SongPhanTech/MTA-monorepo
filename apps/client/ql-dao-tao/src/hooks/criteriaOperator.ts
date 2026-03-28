import type { CriteriaOperator } from "@workspace/db/client"
import { criteriaOperatorOptions } from "@workspace/libs/constants"

export const useCriteriaOperatorOptions = () => {
  const getCriteriaOperatorLabel = (value: CriteriaOperator | null | undefined): string => {
    if (!value) return ""
    return criteriaOperatorOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options: criteriaOperatorOptions,
    getCriteriaOperatorLabel,
  }
}
