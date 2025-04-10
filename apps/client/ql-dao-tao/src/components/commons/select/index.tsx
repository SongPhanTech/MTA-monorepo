import { Select as AntdSelect, type SelectProps as AntdSelectProps } from 'antd'

type SelectProps = AntdSelectProps

const Select = (props: SelectProps) => {
    return <AntdSelect
        showSearch
        filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        notFoundContent="Không có dữ liệu"
        {...props} />
}

export default Select
