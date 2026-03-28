// import { Gender } from '@workspace/db'

export type GenderOption = {
  value: string
  label: string
}

export const useGenderOptions = () => {
  const options: GenderOption[] = [
    { value: "0", label: "Nam" },
    { value: "1", label: "Nữ" },
  ]

  const getGenderLabel = (value: string | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getGenderLabel,
  }
}
