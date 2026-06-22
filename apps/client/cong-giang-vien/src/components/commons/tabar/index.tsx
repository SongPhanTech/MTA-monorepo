import type { TabsProps as TabsAntdProps } from "antd"
import { Tabs as TabAntd } from "antd"
import { useState } from "react"

type TabsProps = {
  items: TabsAntdProps["items"]
} & TabsAntdProps

const Tabs: React.FC<TabsProps> = ({ items, ...props }) => {
  const [active, setActive] = useState("1")

  const handleOnChange = (key: string) => {
    setActive(key)
    props.onChange?.(key)
  }
  return <TabAntd items={items} onChange={handleOnChange} activeKey={active} {...props} />
}

export default Tabs
