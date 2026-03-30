import type { QuestionType } from "@workspace/db"
import { questionTypeOptions } from "@workspace/libs/constants"

export type QuestionTypeOption = {
  value: QuestionType
  label: string
}

export const useQuestionTypeOptions = () => {
  const getQuestionTypeLabel = (value: QuestionType | null | undefined): string => {
    return questionTypeOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options: questionTypeOptions,
    getQuestionTypeLabel,
  }
}
