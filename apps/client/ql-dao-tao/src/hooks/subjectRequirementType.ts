import { SubjectRequirementType } from '@workspace/db'

export type SubjectRequirementTypeOption = {
    value: SubjectRequirementType
    label: string
}

export const useSubjectRequirementTypeOptions = () => {
    const options: SubjectRequirementTypeOption[] = [
        { value: SubjectRequirementType.Mandatory, label: 'Bắt buộc' },
        { value: SubjectRequirementType.Optional, label: 'Tự chọn' },
        { value: SubjectRequirementType.None, label: 'Khác' },
    ]

    const getSubjectRequirementTypeLabel = (
        value: SubjectRequirementType | null | undefined
    ): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getSubjectRequirementTypeLabel,
    }
}
