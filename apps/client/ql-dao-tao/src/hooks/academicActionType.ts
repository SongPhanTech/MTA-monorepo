import { AcademicActionType } from "@workspace/db/client"

export type AcademicActionTypeOption = {
  value: AcademicActionType
  label: string
}

export const useAcademicActionTypeOption = () => {
  const options: AcademicActionTypeOption[] = [
    { value: AcademicActionType.REPEAT_YEAR, label: "Lưu ban" },
    { value: AcademicActionType.SUSPENSION, label: "Đình chỉ" },
    { value: AcademicActionType.EXPULSION, label: "Buộc thôi học" },
  ]

  const getAcademicActionTypeLabel = (value: AcademicActionType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getAcademicActionTypeLabel,
  }
}
