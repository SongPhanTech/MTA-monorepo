import { ThesisProjectStatus } from '@workspace/db/client'

export type ThesisProjectStatusOption = {
    value: ThesisProjectStatus
    label: string
    color?: string
}

export const useThesisProjectStatusOptions = () => {
    const thesisProjectStatusOptions: ThesisProjectStatusOption[] = [
        { value: ThesisProjectStatus.PROPOSED, label: 'Mới đề xuất', color: 'blue' },
        {
            value: ThesisProjectStatus.APPROVED_BY_DEPT,
            label: 'Khoa/Bộ môn đã duyệt',
            color: 'cyan',
        },
        { value: ThesisProjectStatus.ASSIGNED, label: 'Đã giao cho SV', color: 'purple' },
        { value: ThesisProjectStatus.IN_PROGRESS, label: 'Kiểm tra tiến độ', color: 'orange' },
        {
            value: ThesisProjectStatus.DEFENSE_ELIGIBLE,
            label: 'Đủ điều kiện bảo vệ',
            color: 'lime',
        },
        { value: ThesisProjectStatus.DEFENDED_PASSED, label: 'Đã bảo vệ - Đạt', color: 'green' },
        {
            value: ThesisProjectStatus.DEFENDED_FAILED,
            label: 'Đã bảo vệ - Không đạt',
            color: 'red',
        },
        { value: ThesisProjectStatus.COMPLETED, label: 'Đã hoàn thành', color: 'geekblue' },
        { value: ThesisProjectStatus.CANCELED, label: 'Đã hủy', color: 'volcano' },
    ]

    const getThesisProjectStatusLabel = (value: ThesisProjectStatus | null | undefined): string => {
        return thesisProjectStatusOptions.find((opt) => opt.value === value)?.label || ''
    }

    const getThesisProjectStatusColor = (value: ThesisProjectStatus | null | undefined): string => {
        return thesisProjectStatusOptions.find((opt) => opt.value === value)?.color || 'default'
    }
    const ignoreProjectStatus = (
        ignoreStatuses: ThesisProjectStatus[]
    ): ThesisProjectStatusOption[] => {
        return thesisProjectStatusOptions.filter((option) => !ignoreStatuses.includes(option.value))
    }

    return {
        thesisProjectStatusOptions,
        getThesisProjectStatusLabel,
        getThesisProjectStatusColor,
        ignoreProjectStatus,
    }
}
