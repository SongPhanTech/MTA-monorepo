import { StudentTrainingType, TrainingScoreStatus } from "@workspace/db/client"

export type StudentTrainingTypeOption = {
  value: StudentTrainingType
  label: string
  color: string
}

export const useStudentTrainingTypeOptions = () => {
  const options: StudentTrainingTypeOption[] = [
    { value: StudentTrainingType.EXCELLENT, label: "Xuất sắc", color: "green" },
    { value: StudentTrainingType.GOOD, label: "Tốt", color: "blue" },
    { value: StudentTrainingType.FAIR, label: "Khá", color: "cyan" },
    {
      value: StudentTrainingType.MEDIUM,
      label: "Trung bình khá",
      color: "gold",
    },
    {
      value: StudentTrainingType.AVERAGE,
      label: "Trung bình",
      color: "orange",
    },
    { value: StudentTrainingType.POOR, label: "Yếu", color: "volcano" },
    { value: StudentTrainingType.VERY_POOR, label: "Kém", color: "red" },
  ]

  const getStudentTrainingTypeLabel = (value: StudentTrainingType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.label || ""
  }

  const getStudentTrainingTypeColor = (value: StudentTrainingType | null | undefined): string => {
    return options.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    options,
    getStudentTrainingTypeLabel,
    getStudentTrainingTypeColor,
  }
}

const trainingScoreStatus = [
  {
    value: TrainingScoreStatus.PENDING,
    label: "Chờ duyệt",
    color: "blue",
  },
  {
    value: TrainingScoreStatus.APPROVED,
    label: "Đã chấp nhận",
    color: "green",
  },
]

export const useTrainingScoreStatusStatusOptions = () => {
  const statusOptions = [
    {
      value: TrainingScoreStatus.PENDING,
      label: "Chờ duyệt",
      color: "blue",
    },
    {
      value: TrainingScoreStatus.APPROVED,
      label: "Đã chấp nhận",
      color: "green",
    },
  ]

  const getTrainingScoreStatusLabel = (value: TrainingScoreStatus | null | undefined): string => {
    return statusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getTrainingScoreStatusColor = (value: TrainingScoreStatus | null | undefined): string => {
    return statusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    statusOptions,
    getTrainingScoreStatusLabel,
    getTrainingScoreStatusColor,
  }
}
