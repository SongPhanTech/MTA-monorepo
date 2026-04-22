import type { MenuItem } from "@workspace/router"
import { Layout, Menu, Tooltip } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useState } from "react"

const { Sider } = Layout

interface SiderDefaultLayoutProps {
  collapsed: boolean
  theme: "light" | "dark"
  items: MenuItem[]
  onCollapse?: (collapsed: boolean) => void
  logo1: ReactNode
  logo2: ReactNode
}

function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
  const result = menus.map((item) => ({
    label: item.children ? (
      item.label
    ) : (
      <Tooltip title={item.label} placement="right" mouseEnterDelay={0.5}>
        <div>
          <Link href={item.path || "#"} className="block truncate">
            {item.label}
          </Link>
        </div>
      </Tooltip>
    ),
    key: item.path || item.id,
    icon: item.icon ? <item.icon /> : undefined,
    children: item.children
      ? item.children.map((child) => ({
          label: (
            <Tooltip title={child.label} placement="right" mouseEnterDelay={0.5}>
              <Link href={child.path || "#"} className="block truncate">
                {child.label}
              </Link>
            </Tooltip>
          ),
          key: child.path || child.id,
        }))
      : undefined,
  }))

  return result
}

const findOpenKeys = (menus: MenuItem[], currentPath: string | null): string[] => {
  for (const item of menus) {
    if (item.children) {
      const childKeys = findOpenKeys(item.children, currentPath)
      if (childKeys.length > 0) {
        return [item.path || item.id, ...childKeys]
      }
    }
    if (item.path === currentPath) {
      return [item.path || item.id]
    }
  }
  return []
}

const SiderDefaultLayout = ({
  collapsed,
  theme,
  items,
  onCollapse,
  logo1,
  logo2,
}: SiderDefaultLayoutProps) => {
  const pathname = usePathname()

  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))

  return (
    <Sider
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        scrollbarWidth: "none",
        zIndex: 1001,
      }}
      collapsible
      onCollapse={onCollapse}
      collapsed={collapsed}
      theme={theme}
      width={230}
    >
      <div
        className={`flex items-center bg-white justify-center py-3 fixed z-[100] top-[0px] left-[0px] ${collapsed ? "w-[80px]" : "w-[230px]"}`}
      >
        {collapsed ? logo1 : logo2}
      </div>
      <Menu
        className="pb-20 pt-[64px] [&_.ant-menu-item]:overflow-visible [&_.ant-menu-submenu-title]:overflow-visible [&_.ant-menu-item-icon]:inline-flex [&_.ant-menu-item-icon]:h-5 [&_.ant-menu-item-icon]:w-5 [&_.ant-menu-item-icon]:items-center [&_.ant-menu-item-icon]:justify-center [&_.ant-menu-item-icon]:leading-none [&_.ant-menu-item-icon_.anticon]:inline-flex [&_.ant-menu-item-icon_.anticon]:items-center [&_.ant-menu-item-icon_.anticon]:justify-center [&_.ant-menu-item-icon_.anticon]:leading-none [&_.ant-menu-item-icon_.anticon_svg]:h-[18px] [&_.ant-menu-item-icon_.anticon_svg]:w-[18px] [&_.ant-menu-item-icon_.anticon_svg]:align-middle [&_.ant-menu-submenu-title_.ant-menu-item-icon]:inline-flex [&_.ant-menu-submenu-title_.ant-menu-item-icon]:h-5 [&_.ant-menu-submenu-title_.ant-menu-item-icon]:w-5 [&_.ant-menu-submenu-title_.ant-menu-item-icon]:items-center [&_.ant-menu-submenu-title_.ant-menu-item-icon]:justify-center [&_.ant-menu-submenu-title_.ant-menu-item-icon]:leading-none [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon]:inline-flex [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon]:items-center [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon]:justify-center [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon]:leading-none [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon_svg]:h-[18px] [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon_svg]:w-[18px] [&_.ant-menu-submenu-title_.ant-menu-item-icon_.anticon_svg]:align-middle"
        theme={"light"}
        mode="inline"
        selectedKeys={pathname ? [pathname] : []}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={getMenus(items)}
        style={{
          background: "transparent",
          borderTop: "1px solid #f1f1f1",
        }}
      />
    </Sider>
  )
}

export default SiderDefaultLayout
