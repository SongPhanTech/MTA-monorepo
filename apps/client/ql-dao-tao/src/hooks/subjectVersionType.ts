import { SubjectVersionType } from '@workspace/db/client'

export type SubjectVersionTypeOption = {
    value: SubjectVersionType
    label: string
}

export const useSubjectVersionTypeOptions = () => {
    const options: SubjectVersionTypeOption[] = [
        { value: SubjectVersionType.Normal, label: 'Bình thường' },
        { value: SubjectVersionType.Internship, label: 'Thực tập' },
        { value: SubjectVersionType.Research, label: 'Nghiên cứu' },
        { value: SubjectVersionType.Project, label: 'Đồ án' },
        { value: SubjectVersionType.Practice, label: 'Thực hành' },
        { value: SubjectVersionType.Graduation, label: 'Tốt nghiệp' },
    ]

    const getSubjectVersionTypeLabel = (value: SubjectVersionType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getSubjectVersionTypeLabel,
    }
}
