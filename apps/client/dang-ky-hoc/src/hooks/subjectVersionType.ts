import type { SubjectVersionType } from '@workspace/db/client'
import { subjectVersionTypesOptions } from '@workspace/libs/constants'

export type SubjectVersionTypeOption = {
    value: SubjectVersionType
    label: string
}

export const useSubjectVersionTypeOptions = () => {
    const getSubjectVersionTypeLabel = (value: SubjectVersionType | null | undefined): string => {
        return subjectVersionTypesOptions.find((opt) => opt.value === value)?.label || ''
    }

    return {
        subjectVersionTypesOptions,
        getSubjectVersionTypeLabel,
    }
}
