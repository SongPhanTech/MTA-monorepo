import { Layout, Menu, type MenuProps } from "antd"
import type { ReactNode } from "react"

const { Sider } = Layout
interface SiderDefaultLayoutProps {
  collapsed: boolean
  theme: "light" | "dark"
  onCollapse?: (collapsed: boolean) => void
  onClickMenu?: MenuProps["onClick"]
  items: MenuProps["items"]
  logo1: ReactNode
  logo2: ReactNode
}

const SiderDefaultLayout = ({
  collapsed,
  theme,
  onCollapse,
  onClickMenu,
  items,
  logo1,
  logo2,
}: SiderDefaultLayoutProps) => {
  return (
    <Sider collapsible onCollapse={onCollapse} collapsed={collapsed} theme={theme} width={250}>
      <div className="flex items-center justify-center my-4">{collapsed ? logo1 : logo2}</div>
      <Menu
        theme={theme}
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={items}
        onClick={onClickMenu}
      />
    </Sider>
  )
}

export default SiderDefaultLayout
