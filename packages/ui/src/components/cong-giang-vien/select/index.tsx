import { fuzzyMatch } from "@workspace/libs/utils"
import { Select as AntdSelect, type SelectProps as AntdSelectProps } from "antd"

type TSelectFloat = AntdSelectProps & {
  label?: React.ReactNode
}

const SelectFloat = ({ label, className, ...props }: TSelectFloat) => {
  const select = (
    <AntdSelect
      popupMatchSelectWidth={false}
      allowClear
      showSearch
      filterOption={(input, option) => fuzzyMatch(input, option?.label?.toString() || "")}
      notFoundContent="Không có dữ liệu"
      className={`${label ? "h-10 w-full" : className ?? ""}`}
      {...props}
    />
  )

  if (!label) return select

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <span className="pointer-events-none absolute -top-2 left-2.5 z-10 bg-white px-1 text-xs leading-none text-gray-500">
        {label}
      </span>
      {select}
    </div>
  )
}

export { SelectFloat }
