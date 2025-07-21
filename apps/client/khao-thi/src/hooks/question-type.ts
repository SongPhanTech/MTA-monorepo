import { QuestionType } from '@workspace/db'

export type QuestionTypeOption = {
    value: QuestionType
    label: string
}

export const useQuestionTypeOptions = () => {
    const options: QuestionTypeOption[] = [{ value: QuestionType.ESSAY, label: 'Tự luận' }]

    const getQuestionTypeLabel = (value: QuestionType | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getQuestionTypeLabel,
    }
}
