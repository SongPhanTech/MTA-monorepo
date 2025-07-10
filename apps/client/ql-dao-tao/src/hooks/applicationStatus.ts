import { ApplicationStatus } from '@workspace/db'

export type ApplicationStatusOption = {
    value: ApplicationStatus
    label: string
    color?: string
}

export const useApplicationStatusOptions = () => {
    const applicationStatusOptions: ApplicationStatusOption[] = [
        { value: ApplicationStatus.SUBMITTED, label: 'Mới nộp', color: 'blue' },
        {
            value: ApplicationStatus.APPROVED,
            label: 'Được chấp thuận',
            color: 'green',
        },
        { value: ApplicationStatus.IN_REVIEW, label: 'Đang được xem xét', color: 'orange' },
        { value: ApplicationStatus.REJECTED, label: 'Bị từ chối', color: 'red' },
    ]

    const getApplicationStatusLabel = (value: ApplicationStatus | null | undefined): string => {
        return applicationStatusOptions.find((opt) => opt.value === value)?.label || ''
    }

    const getApplicationStatusColor = (value: ApplicationStatus | null | undefined): string => {
        return applicationStatusOptions.find((opt) => opt.value === value)?.color || 'default'
    }

    return {
        applicationStatusOptions,
        getApplicationStatusLabel,
        getApplicationStatusColor,
    }
}
