import { SubjectClassType } from "@workspace/db/client"

export type SubjectClassTypeOption = {
  value: SubjectClassType
  label: string
}

export const useSubjectClassTypeOptions = () => {
  const options: SubjectClassTypeOption[] = [
    { value: SubjectClassType.NORMAL, label: "Bình thường" },
    { value: SubjectClassType.RETAKE, label: "Học lại" },
    { value: SubjectClassType.REEXAM, label: "Thi lại" },
  ]

  const getSubjectClassTypeLabel = (value: SubjectClassType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getSubjectClassTypeLabel,
  }
}
