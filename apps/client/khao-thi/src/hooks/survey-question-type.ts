import { SurveyQuestionType } from "@workspace/db"

export type SurveyQuestionTypeOption = {
  value: SurveyQuestionType
  label: string
}

export const useSurveyQuestionTypeOptions = () => {
  const options: SurveyQuestionTypeOption[] = [
    { value: SurveyQuestionType.ESSAY, label: "Tự luận" },
    { value: SurveyQuestionType.SINGLE_CHOICE, label: "Trắc nghiệm" },
  ]

  const getSurveyQuestionTypeLabel = (value: SurveyQuestionType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getSurveyQuestionTypeLabel,
  }
}
