import { ExamType } from "@workspace/db"

export type ExamTypeOption = {
  value: ExamType
  label: string
}

export const useExamTypeOptions = () => {
  const options: ExamTypeOption[] = [
    { value: ExamType.OfflineWritten, label: "Thi viết" },
    { value: ExamType.OnlineWritten, label: "Trực tuyến" },
    // { value: ExamType.OfflineChoices, label: 'Thi trắc nghiệm' },
    // { value: ExamType.OnlineChoices, label: 'Thi trắc nghiệm trực tuyến' },
    { value: ExamType.Oral, label: "Vấn đáp" },
    { value: ExamType.Practice, label: "Thực hành - Thí nghiệm" },
    { value: ExamType.Project, label: "Đồ án" },
    { value: ExamType.Other, label: "Loại khác" },
  ]

  const getExamTypeLabel = (value: ExamType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  return {
    options,
    getExamTypeLabel,
  }
}
