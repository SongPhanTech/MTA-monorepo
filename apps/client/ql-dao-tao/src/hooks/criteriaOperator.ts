import type { CriteriaOperator } from '@workspace/db'
import { criteriaOperatorOptions } from '@workspace/libs/constants'

export const useCriteriaOperatorOptions = () => {
    const options: CriteriaOperatorOption[] = [
        { value: CriteriaOperator.GT, label: '> (Lớn hơn)' },
        { value: CriteriaOperator.GTE, label: '>= (Lớn hơn hoặc bằng)' },
        { value: CriteriaOperator.LT, label: '< (Nhỏ hơn)' },
        { value: CriteriaOperator.LTE, label: '<= (Nhỏ hơn hoặc bằng)' },
        { value: CriteriaOperator.EQ, label: '= (Bằng)' },
        { value: CriteriaOperator.IN, label: 'IN (Thuộc danh sách)' },
    ]

    const getCriteriaOperatorLabel = (value: CriteriaOperator | null | undefined): string => {
        if (!value) return ''
        return criteriaOperatorOptions.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options: criteriaOperatorOptions,
        getCriteriaOperatorLabel,
    }
}
