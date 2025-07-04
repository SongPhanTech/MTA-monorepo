import { CriteriaOperator } from '@workspace/db'

export type CriteriaOperatorOption = {
    value: CriteriaOperator
    label: string
}

export const useCriteriaOperatorOptions = () => {
    const options: CriteriaOperatorOption[] = [
        { value: CriteriaOperator.GTE, label: '>= (Lớn hơn hoặc bằng)' },
        { value: CriteriaOperator.LTE, label: '<= (Nhỏ hơn hoặc bằng)' },
        { value: CriteriaOperator.EQ, label: '= (Bằng)' },
        { value: CriteriaOperator.IN, label: 'IN (Thuộc danh sách)' },
    ]

    const getCriteriaOperatorLabel = (value: CriteriaOperator | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getCriteriaOperatorLabel,
    }
}
