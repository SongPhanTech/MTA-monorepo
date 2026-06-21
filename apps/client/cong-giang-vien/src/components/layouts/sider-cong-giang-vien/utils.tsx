import type { MenuItem } from "@workspace/router"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

const renderMenuLabel = (item: MenuItem): ReactNode => {
  const content = (
    <span className="flex w-full min-w-0 items-center justify-between gap-2">
      <span className="truncate">{item.label}</span>
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

export const buildMenuItems = (menus: MenuItem[]): ItemType<MenuItemType>[] =>
  menus.map((item) => {
    const Icon = item.icon as LucideIcon | undefined
    return {
      label: renderMenuLabel(item),
      key: item.path || item.id,
      icon: Icon ? <Icon className="giang-vien-menu-icon" size={18} /> : undefined,
      children: item.children
        ? item.children.map((child) => ({
            label: renderMenuLabel(child),
            key: child.path || child.id,
          }))
        : undefined,
    }
  })

export const findOpenKeys = (menus: MenuItem[], currentPath: string | null): string[] => {
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
  menus: MenuItem[],
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
