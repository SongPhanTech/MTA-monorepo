import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon"
import NAVIGATION, { type MenuItem } from "@workspace/router"
import type { CascaderProps } from "antd"
import { Cascader } from "antd"
import type { BaseOptionType } from "antd/es/cascader"
import type { LucideProps } from "lucide-react"

type SearchSystemOptionType = BaseOptionType & {
  Icon?:
    | React.ForwardRefExoticComponent<
        Omit<AntdIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>
      >
    | React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
  path?: string
}

const navigationToOptions = (navs?: MenuItem[]): SearchSystemOptionType[] => {
  if (!navs) return []
  return Object.entries(navs).map(([, value]) => ({
    value: value.path,
    path: value.path,
    label: value.label,
    Icon: value.icon,
    children: navigationToOptions(value.children),
  }))
}

const options: SearchSystemOptionType[] = Object.entries(NAVIGATION).map(([key, value]) => ({
  value: key,
  label: value.label,
  children: navigationToOptions(value.menus),
}))

const onChange: CascaderProps<SearchSystemOptionType>["onChange"] = (value, selectedOptions) => {
  console.log(value, selectedOptions)
}
const filter = (inputValue: string, path: SearchSystemOptionType[]) =>
  path.some(
    (option) => (option.label as string).toLowerCase().indexOf(inputValue.toLowerCase()) > -1
  )
const SearchSystem = () => {
  return (
    <Cascader<SearchSystemOptionType>
      options={options}
      value={[]}
      optionRender={({ label, Icon, path }) => (
        <a href={path ?? "#"} className="flex gap-2">
          {Icon && <Icon />}
          {label}
        </a>
      )}
      onChange={onChange}
      placeholder="Tìm kiếm hệ thống"
      showSearch={{ filter }}
      onSearch={(value) => console.log(value)}
    />
  )
}

export { SearchSystem }
