import { SubjectClassStatus } from '@workspace/db/client'

export type SubjectClassStatusOption = {
    value: SubjectClassStatus
    label: string
    color: string
}

export const useSubjectClassStatusOptions = () => {
    const options: SubjectClassStatusOption[] = [
        { value: SubjectClassStatus.DRAFT, label: 'Nháp', color: 'default' },
        { value: SubjectClassStatus.PENDING, label: 'Chờ duyệt', color: 'warning' },
        { value: SubjectClassStatus.APPROVED, label: 'Đã duyệt', color: 'success' },
        { value: SubjectClassStatus.REJECTED, label: 'Từ chối', color: 'error' },
        { value: SubjectClassStatus.TEACHING, label: 'Đang dạy', color: 'processing' },
        { value: SubjectClassStatus.FINISHED, label: 'Hoàn thành', color: 'success' },
    ]

    const getSubjectClassStatusLabel = (value: SubjectClassStatus | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    const getSubjectClassStatusColor = (value: SubjectClassStatus | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.color || 'default'
    }

    return {
        options,
        getSubjectClassStatusLabel,
        getSubjectClassStatusColor,
    }
}
