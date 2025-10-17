import { StudentTrainingType } from '@workspace/db/client'

export type StudentTrainingTypeOption = {
    value: StudentTrainingType
    label: string
    color: string
}

export const useStudentTrainingTypeOptions = () => {
    const options: StudentTrainingTypeOption[] = [
        { value: StudentTrainingType.EXCELLENT, label: 'Xuất sắc', color: 'green' },
        { value: StudentTrainingType.GOOD, label: 'Tốt', color: 'blue' },
        { value: StudentTrainingType.FAIR, label: 'Khá', color: 'cyan' },
        { value: StudentTrainingType.MEDIUM, label: 'Trung bình khá', color: 'gold' },
        { value: StudentTrainingType.AVERAGE, label: 'Trung bình', color: 'orange' },
        { value: StudentTrainingType.POOR, label: 'Yếu', color: 'volcano' },
        { value: StudentTrainingType.VERY_POOR, label: 'Kém', color: 'red' },
    ]

    const getStudentTrainingTypeLabel = (value: StudentTrainingType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    const getStudentTrainingTypeColor = (value: StudentTrainingType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.color || 'default'
    }

    return {
        options,
        getStudentTrainingTypeLabel,
        getStudentTrainingTypeColor,
    }
}
