import { FixedClassType } from "@workspace/db/client"

export type FixedClassTypeOption = {
  value: FixedClassType
  label: string
}

export const useFixedClassTypeOptions = () => {
  const options: FixedClassTypeOption[] = [
    { value: FixedClassType.APPLICATION, label: "Lớp Ứng dụng" },
    { value: FixedClassType.RESEARCH, label: "Lớp Nghiên cứu" },
    { value: FixedClassType.NORMAL, label: "Lớp Thông thường" },
  ]

  const getFixedClassTypeLabel = (value: FixedClassType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || "Lớp thường"
  }

  return {
    options,
    getFixedClassTypeLabel,
  }
}
