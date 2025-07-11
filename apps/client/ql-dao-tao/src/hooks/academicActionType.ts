import { AcademicActionType } from '@workspace/db'

export type AcademicActionTypeOption = {
    value: AcademicActionType
    label: string
}

export const useAcademicActionTypeOption = () => {
    const options: AcademicActionTypeOption[] = [
        { value: AcademicActionType.REPEAT_YEAR, label: 'Lưu ban (Học lại năm) - cho hệ quân sự' },
        { value: AcademicActionType.SUSPENSION, label: 'Đình chỉ học tập' },
        { value: AcademicActionType.EXPULSION, label: 'Buộc thôi học' },
    ]

    const getAcademicActionTypeLabel = (value: AcademicActionType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getAcademicActionTypeLabel,
    }
}
