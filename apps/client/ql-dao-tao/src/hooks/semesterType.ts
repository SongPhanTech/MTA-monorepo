import { SemesterType } from "@workspace/db/client"

export type SemesterTypeOption = {
  value: SemesterType
  label: string
}

export const useSemesterTypeOptions = () => {
  const options: SemesterTypeOption[] = [
    { value: SemesterType.FIRST, label: "Học kỳ 1" },
    { value: SemesterType.SECOND, label: "Học kỳ 2" },
    { value: SemesterType.FIRST_SUPPLEMENTARY, label: "Học kỳ phụ HK1" },
    { value: SemesterType.SECOND_SUPPLEMENTARY, label: "Học kỳ phụ HK2" },
    { value: SemesterType.SUMMER, label: "Học kỳ hè" },
    { value: null as unknown as SemesterType, label: "Học kỳ khác (có thể tạo trùng)" },
  ]

  const getSemesterTypeLabel = (value: SemesterType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || "Học kỳ khác"
  }

  return {
    options,
    getSemesterTypeLabel,
  }
}
