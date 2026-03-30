import type { ExamType } from "@workspace/db"
import { examTypeOptions } from "@workspace/libs/constants"

export type ExamTypeOption = {
  value: ExamType
  label: string
}

export const useExamTypeOptions = () => {
  const getExamTypeLabel = (value: ExamType | null | undefined): string => {
    return examTypeOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options: examTypeOptions,
    getExamTypeLabel,
  }
}
