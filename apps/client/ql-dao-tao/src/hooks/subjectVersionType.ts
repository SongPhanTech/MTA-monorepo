import type { SubjectVersionType } from "@workspace/db/client"
import { subjectVersionTypeOptions } from "@workspace/libs/constants"

export type SubjectVersionTypeOption = {
  value: SubjectVersionType
  label: string
}

export const useSubjectVersionTypeOptions = () => {
  const getSubjectVersionTypeLabel = (value: SubjectVersionType | null | undefined): string => {
    return subjectVersionTypeOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options: subjectVersionTypeOptions,
    getSubjectVersionTypeLabel,
  }
}
