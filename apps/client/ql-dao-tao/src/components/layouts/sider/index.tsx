import type { MenuItem } from "@workspace/router"
import { Menu } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
// Định nghĩa kiểu dữ liệu cho props của SiderDefaultLayout
interface SiderDefaultLayoutProps {
  theme: "light" | "dark"
  items: MenuItem[]
}

// Hàm hỗ trợ để chuyển đổi "item props" thành thành cấu trúc phù hợp
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
  return menus.map((item) => ({
    label: item.children ? (
      <span className="flex items-center gap-2">
        {item.icon ? <item.icon /> : undefined}
        {item.label}
      </span>
    ) : (
      <Link href={item.path || "#"} className="flex items-center gap-2">
        {item.icon ? <item.icon /> : undefined}
        {item.label}
      </Link>
    ),
    key: item.path || item.id,
    children: item.children
      ? item.children.map((child) => ({
          label: (
            <Link href={child.path || "#"} className="flex items-center gap-2">
              {child.icon ? <child.icon /> : undefined}
              {child.label}
            </Link>
          ),
          key: child.path || child.id,
          children: child.children
            ? child.children.map((grandChild) => ({
                label: (
                  <Link href={grandChild.path || "#"} className="flex items-center gap-2">
                    {grandChild.icon ? <grandChild.icon /> : undefined}
                    {grandChild.label}
                  </Link>
                ),
                key: grandChild.path || grandChild.id,
              }))
            : undefined,
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

      if (normalizedPathname === normalizedPath || pathname.startsWith(item.path + "/")) {
        return item.path
      }
    }
  }
  return undefined
}
const SidebarMenuLayout = ({ items }: SiderDefaultLayoutProps) => {
  const pathname = usePathname()

  const selectedKeys = useMemo(() => {
    const cleanPathname = pathname?.split("?")[0].split("#")[0] || "/"
    const matched = findMatchingKey(items, cleanPathname)
    return matched ? [matched] : [cleanPathname]
  }, [items, pathname])

  const menuItems = useMemo(() => getMenus(items), [items])

  return (
    <Menu
      theme="light"
      mode="horizontal"
      className="top-[60px] border-t-slate-200 border-t border-solid fixed w-full z-[999] bg-white"
      selectedKeys={selectedKeys}
      items={menuItems}
      style={{ background: "white" }}
    />
  )
}

export default SidebarMenuLayout
