import { fuzzyMatch } from "@workspace/libs/utils"
import { Select as AntdSelect, type SelectProps as AntdSelectProps } from "antd"

type SelectProps = AntdSelectProps

const Select = (props: SelectProps) => {
  return (
    <AntdSelect
      allowClear
      showSearch
      filterOption={(input, option) => fuzzyMatch(input, option?.label?.toString() || "")}
      notFoundContent="Không có dữ liệu"
      {...props}
    />
  )
}

export default Select
