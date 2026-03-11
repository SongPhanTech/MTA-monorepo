import { ExamType } from '@workspace/db/client'
import { examTypeOptions } from '@workspace/libs/constants'

export type ExamTypeOption = {
    value: ExamType
    label: string
}

export enum ExamTypeExportPCGD {
    ORAL = 'VD',
}

export const useExamTypeOptions = () => {
    const getExamTypeLabel = (
        value: ExamType | null | undefined,
        options?: { exportPCGD?: boolean }
    ): string => {
        if (options?.exportPCGD && value === ExamType.Oral) return ExamTypeExportPCGD.ORAL

        const examTypeLabel = examTypeOptions.find((opt) => opt.value === value)?.label || ''
        return examTypeLabel
    }

    return {
        options: examTypeOptions,
        getExamTypeLabel,
    }
}
