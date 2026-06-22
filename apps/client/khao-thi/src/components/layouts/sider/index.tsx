import SidebarMenuToggle from "@components/layouts/sidebar-menu-toggle"
import type { MenuItem } from "@workspace/router"
import { Layout, Menu, Tooltip } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

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
  return menus.map((item) => ({
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

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([])
      return
    }
    setOpenKeys(findOpenKeys(items, pathname))
  }, [collapsed, items, pathname])

  return (
    <Sider
      className="khao-thi-sider"
      style={{
        overflow: "hidden",
        height: "100vh",
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        scrollbarWidth: "none",
      }}
      collapsible
      trigger={null}
      onCollapse={onCollapse}
      collapsed={collapsed}
      theme={theme}
      width={230}
    >
      <div
        className={`khao-thi-sider-logo ${collapsed ? "khao-thi-sider-logo--collapsed" : ""}`}
      >
        {collapsed ? logo1 : logo2}
      </div>
      <Menu
        className="khao-thi-sider-menu"
        theme="light"
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={pathname ? [pathname] : []}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={getMenus(items)}
      />
      <div className="khao-thi-sider-footer">
        <SidebarMenuToggle collapsed={collapsed} onToggle={(value) => onCollapse?.(value)} />
      </div>
    </Sider>
  )
}

export default SiderDefaultLayout
