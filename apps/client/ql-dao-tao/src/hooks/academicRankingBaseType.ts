import { AcademicRankingBaseType } from "@workspace/db/client"

export type AcademicRankingBaseTypeOption = {
  value: AcademicRankingBaseType
  label: string
}

export const useAcademicRankingBaseTypeOptions = () => {
  const options: AcademicRankingBaseTypeOption[] = [
    { value: AcademicRankingBaseType.Base10, label: "10" },
    { value: AcademicRankingBaseType.Base4, label: "4" },
  ]

  const getAcademicRankingBaseTypeLabel = (
    value: AcademicRankingBaseType | null | undefined
  ): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getAcademicRankingBaseTypeLabel,
  }
}
