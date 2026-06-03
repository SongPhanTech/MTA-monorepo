import type { MenuItem } from "@workspace/router"
import { Layout, Menu, Tooltip } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useMemo, useState } from "react"

const { Sider } = Layout

interface SiderGiangVienProps {
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

const findMatchingKey = (menus: MenuItem[], pathname: string | null): string | undefined => {
  if (!pathname) return undefined
  for (const item of menus) {
    if (item.children && item.children.length > 0) {
      const childMatch = findMatchingKey(item.children, pathname)
      if (childMatch) return childMatch
    }
    if (item.path) {
      const normalizedPath = item.path.replace(/\/$/, "")
      const normalizedPathname = pathname.replace(/\/$/, "")
      if (normalizedPathname === normalizedPath || pathname.startsWith(`${item.path}/`)) {
        return item.path
      }
    }
  }
  return undefined
}

const SiderGiangVien = ({
  collapsed,
  theme,
  items,
  onCollapse,
  logo1,
  logo2,
}: SiderGiangVienProps) => {
  const pathname = usePathname()
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))

  const selectedKeys = useMemo(() => {
    const cleanPathname = pathname?.split("?")[0].split("#")[0] || "/"
    const matched = findMatchingKey(items, cleanPathname)
    return matched ? [matched] : [cleanPathname]
  }, [items, pathname])

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
        background: "#fff",
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
        className="pb-20 pt-[64px]"
        theme={"light"}
        mode="inline"
        selectedKeys={selectedKeys}
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

export default SiderGiangVien
