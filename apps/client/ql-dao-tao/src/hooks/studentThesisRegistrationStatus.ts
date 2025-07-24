import { StudentThesisRegistrationStatus } from '@workspace/db'

export type StudentThesisRegistrationStatusOption = {
    value: StudentThesisRegistrationStatus
    label: string
    color?: string
}

export const useStudentThesisRegistrationStatusOptions = () => {
    const statusOptions: StudentThesisRegistrationStatusOption[] = [
        { value: StudentThesisRegistrationStatus.PENDING, label: 'Chờ duyệt', color: 'blue' },
        { value: StudentThesisRegistrationStatus.ACCEPTED, label: 'Đã chấp nhận', color: 'green' },
        { value: StudentThesisRegistrationStatus.REJECTED, label: 'Đã từ chối', color: 'red' },
    ]

    const getStudentThesisRegistrationStatusLabel = (
        value: StudentThesisRegistrationStatus | null | undefined
    ): string => {
        return statusOptions.find((opt) => opt.value === value)?.label || ''
    }

    const getStudentThesisRegistrationStatusColor = (
        value: StudentThesisRegistrationStatus | null | undefined
    ): string => {
        return statusOptions.find((opt) => opt.value === value)?.color || 'default'
    }

    return {
        statusOptions,
        getStudentThesisRegistrationStatusLabel,
        getStudentThesisRegistrationStatusColor,
    }
}
