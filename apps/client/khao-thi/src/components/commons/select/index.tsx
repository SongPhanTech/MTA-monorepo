import { Select as AntdSelect, type SelectProps as AntdSelectProps } from 'antd'

type SelectProps = AntdSelectProps

const Select = (props: SelectProps) => {
    function normalizeVietnamese(str: string): string {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
    }

    function fuzzyMatch(input: string, label: string): boolean {
        const normInput = normalizeVietnamese(input)
        const normLabel = normalizeVietnamese(label)

        // 1. Nếu chứa trực tiếp
        if (normLabel.includes(normInput)) return true

        // 2. Nếu là viết tắt
        let i = 0
        let j = 0
        while (i < normInput.length && j < normLabel.length) {
            if (normInput[i] === normLabel[j]) i++
            j++
        }
        return i === normInput.length
    }
    return (
        <AntdSelect
            allowClear
            showSearch
            filterOption={(input, option) => fuzzyMatch(input, option?.label?.toString() || '')}
            notFoundContent="Không có dữ liệu"
            {...props}
        />
    )
}

export default Select
