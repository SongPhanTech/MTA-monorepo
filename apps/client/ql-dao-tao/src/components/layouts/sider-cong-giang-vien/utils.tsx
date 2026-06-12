import type { CongGiangVienMenuItem } from "@constants/cong-giang-vien-menu"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import { Badge } from "antd"
import Link from "next/link"
import type { ReactNode } from "react"

const renderMenuLabel = (item: CongGiangVienMenuItem): ReactNode => {
  const content = (
    <span className="flex w-full min-w-0 items-center justify-between gap-2">
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <Badge count={item.badge} size="small" className="giang-vien-menu-badge shrink-0" />
      ) : null}
    </span>
  )

  if (item.children?.length) {
    return content
  }

  return (
    <Link href={item.path || "#"} className="block min-w-0 truncate">
      {content}
    </Link>
  )
}

export const buildMenuItems = (menus: CongGiangVienMenuItem[]): ItemType<MenuItemType>[] =>
  menus.map((item) => ({
    label: renderMenuLabel(item),
    key: item.path || item.id,
    icon: item.icon ? <item.icon className="giang-vien-menu-icon" size={18} /> : undefined,
    children: item.children
      ? item.children.map((child) => ({
          label: renderMenuLabel(child),
          key: child.path || child.id,
        }))
      : undefined,
  }))

export const findOpenKeys = (
  menus: CongGiangVienMenuItem[],
  currentPath: string | null
): string[] => {
  for (const item of menus) {
    if (item.children) {
      for (const child of item.children) {
        if (child.path === currentPath) {
          return [item.path || item.id]
        }
      }
    }
    if (item.path === currentPath) {
      return [item.path || item.id]
    }
  }
  return []
}

export const findMatchingKey = (
  menus: CongGiangVienMenuItem[],
  pathname: string | null
): string | undefined => {
  if (!pathname) return undefined

  for (const item of menus) {
    if (item.children?.length) {
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
