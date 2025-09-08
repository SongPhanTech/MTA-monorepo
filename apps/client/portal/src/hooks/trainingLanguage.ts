import { TrainingLanguage } from '@workspace/db'

export type TrainingLanguageOption = {
    value: TrainingLanguage
    label: string
}

export const useTrainingLanguageOptions = () => {
    const options: TrainingLanguageOption[] = [
        { value: TrainingLanguage.English, label: 'Tiếng anh' },
        { value: TrainingLanguage.Vietnamese, label: 'Tiếng việt' },
    ]

    const getTrainingLanguageLabel = (value: TrainingLanguage | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getTrainingLanguageLabel,
    }
}
