import { DiplomaTypeEnum } from "@workspace/db/client"

export type DiplomaTypeOption = {
  value: DiplomaTypeEnum
  label: string
}

export const useDiplomaTypeOptions = () => {
  const options: DiplomaTypeOption[] = [
    { value: DiplomaTypeEnum.MASTER, label: "Thạc sĩ" },
    { value: DiplomaTypeEnum.DOCTORATE, label: "Tiến sĩ" },
    { value: DiplomaTypeEnum.ENGINEER, label: "Kỹ sư" },
    { value: DiplomaTypeEnum.BACHELOR, label: "Cử nhân" },
  ]

  const getDiplomaTypeLabel = (value: DiplomaTypeEnum | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getDiplomaTypeLabel,
  }
}
