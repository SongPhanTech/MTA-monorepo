import { ExamType } from '@workspace/db'

export type ExamTypeOption = {
    value: ExamType
    label: string
}

export const useExamTypeOptions = () => {
    const options: ExamTypeOption[] = [
        { value: ExamType.OfflineWritten, label: 'Thi viết' },
        { value: ExamType.OnlineWritten, label: 'Thi viết trực tuyến' },
        { value: ExamType.OfflineChoices, label: 'Thi trắc nghiệm' },
        { value: ExamType.OnlineChoices, label: 'Thi trắc nghiệm trực tuyến' },
        { value: ExamType.Oral, label: 'Thi vấn đáp' },
        { value: ExamType.Practice, label: 'Thi thực hành' },
        { value: ExamType.Project, label: 'Thi đồ án' },
        { value: ExamType.Other, label: 'Loại khác' },
    ]

    const getExamTypeLabel = (value: ExamType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getExamTypeLabel,
    }
}
