import { SubjectRequirementType } from '@workspace/db'

export type SubjectRequirementTypeOption = {
    value: SubjectRequirementType
    label: string
}

export const useSubjectRequirementTypeOptions = () => {
    const options: SubjectRequirementTypeOption[] = [
        { value: SubjectRequirementType.None, label: 'Không xác định' },
        { value: SubjectRequirementType.Mandatory, label: 'Bắt buộc' },
        { value: SubjectRequirementType.Optional, label: 'Tự chọn' },
    ]

    const getSubjectRequirementTypeLabel = (
        value: SubjectRequirementType
    ): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getSubjectRequirementTypeLabel,
    }
}
