export enum HistorySubjectVersionActionType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export type HistorySubjectVersionActionOption = {
  value: string
  label: string
  color: string
}

export const useHistorySubjectVersionActionOptions = () => {
  const options: HistorySubjectVersionActionOption[] = [
    { value: HistorySubjectVersionActionType.CREATE, label: "Tạo mới", color: "success" },
    { value: HistorySubjectVersionActionType.UPDATE, label: "Cập nhật", color: "processing" },
    { value: HistorySubjectVersionActionType.DELETE, label: "Xóa", color: "error" },
  ]

  const getHistoryActionLabel = (value: string | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || value || ""
  }

  const getHistoryActionColor = (value: string | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    options,
    getHistoryActionLabel,
    getHistoryActionColor,
  }
}
