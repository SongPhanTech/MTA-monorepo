import type { CriteriaField } from "@workspace/db/client"
import { criteriaFieldOptions } from "@workspace/libs/constants"

export const useCriteriaFieldOptions = () => {
  const getCriteriaFieldLabel = (value: CriteriaField | null | undefined): string => {
    return criteriaFieldOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options: criteriaFieldOptions,
    getCriteriaFieldLabel,
  }
}
