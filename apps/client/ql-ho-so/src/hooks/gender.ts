import { Gender } from '@workspace/db'

export type GenderOption = {
    value: Gender
    label: string
}

export const useGenderOptions = () => {
    const options: GenderOption[] = [
        { value: Gender.Male, label: 'Nam' },
        { value: Gender.Female, label: 'Nữ' },
    ]

    const getGenderLabel = (value: Gender | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getGenderLabel,
    }
}
