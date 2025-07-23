import { ExamStatus } from '@workspace/db'

export type ExamStatusOption = {
    value: ExamStatus
    label: string
    color: string
}

export const useExamStatusOptions = () => {
    const options: ExamStatusOption[] = [
        { value: ExamStatus.DRAFT, label: 'Bản nháp', color: 'gray' },
        { value: ExamStatus.PUBLISHED, label: 'Đã công bố', color: 'blue' },
        { value: ExamStatus.ONGOING, label: 'Đang diễn ra', color: 'green' },
        { value: ExamStatus.FINISHED, label: 'Đã kết thúc', color: 'purple' },
        { value: ExamStatus.ARCHIVED, label: 'Đã lưu trữ', color: 'orange' },
    ]

    const getExamStatusLabel = (value: ExamStatus | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    const getExamStatusColor = (value: ExamStatus | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.color || 'default'
    }

    return {
        options,
        getExamStatusLabel,
        getExamStatusColor,
    }
}
