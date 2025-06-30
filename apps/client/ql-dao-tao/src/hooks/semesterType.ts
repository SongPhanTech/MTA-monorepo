import { SemesterType } from '@workspace/db'

export type SemesterTypeOption = {
    value: SemesterType
    label: string
}

export const useSemesterTypeOptions = () => {
    const options: SemesterTypeOption[] = [
        { value: SemesterType.FIRST, label: 'Học kỳ 1' },
        { value: SemesterType.SECOND, label: 'Học kỳ 2' },
    ]

    const getSemesterTypeLabel = (value: SemesterType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || 'Học kỳ khác'
    }

    return {
        options,
        getSemesterTypeLabel,
    }
}
