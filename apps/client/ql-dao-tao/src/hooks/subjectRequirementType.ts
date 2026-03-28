import { SubjectRequirementType } from "@workspace/db/client"

export type SubjectRequirementTypeOption = {
  value: SubjectRequirementType
  label: string
}

export const useSubjectRequirementTypeOptions = () => {
  const options: SubjectRequirementTypeOption[] = [
    { value: SubjectRequirementType.Mandatory, label: "Bắt buộc" },
    { value: SubjectRequirementType.Optional, label: "Tự chọn" },
  ]

  const getSubjectRequirementTypeLabel = (
    value: SubjectRequirementType | null | undefined
  ): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getSubjectRequirementTypeLabel,
  }
}
