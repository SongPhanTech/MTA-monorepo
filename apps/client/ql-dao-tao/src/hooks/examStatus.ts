import { ExamStatus } from '@workspace/db/client'

export type ExamStatusOption = {
    value: ExamStatus
    label: string
    color: string
}

export const useExamStatusOptions = () => {
    const options: ExamStatusOption[] = [
        { value: ExamStatus.DRAFT, label: 'Nháp', color: 'default' },
        { value: ExamStatus.PENDING, label: 'Chờ duyệt', color: 'warning' },
        { value: ExamStatus.APPROVED, label: 'Đã duyệt', color: 'success' },
        { value: ExamStatus.REJECTED, label: 'Từ chối', color: 'error' },
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
