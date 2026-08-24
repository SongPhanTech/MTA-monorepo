import type { MenuItem } from "@workspace/router"
import { Badge } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ComponentType, ReactNode } from "react"

type BuildMenuItemsOptions = {
  menuBadges?: Record<string, number>
  collapsed?: boolean
}

type MenuIcon = LucideIcon | ComponentType<{ className?: string; size?: number }>

const laySoBadge = (item: MenuItem, menuBadges?: Record<string, number>) => {
  if (!item.path || !menuBadges) return 0
  return menuBadges[item.path] ?? 0
}

const renderMenuLabel = (item: MenuItem, badgeCount: number): ReactNode => {
  const content = (
    <span className="flex w-full min-w-0 items-center justify-between gap-2">
      <span className="truncate">{item.label}</span>
      {badgeCount > 0 ? (
        <Badge
          count={badgeCount}
          size="small"
          className="ho-so-menu-badge shrink-0"
          overflowCount={99}
        />
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

const renderMenuIcon = (Icon: MenuIcon, badgeCount: number, collapsed?: boolean) => {
  const icon = <Icon className="ho-so-menu-icon" size={18} />

  if (!collapsed || badgeCount <= 0) {
    return icon
  }

  return (
    <Badge
      count={badgeCount}
      size="small"
      className="ho-so-menu-badge"
      overflowCount={99}
      offset={[-2, 2]}
    >
      {icon}
    </Badge>
  )
}

export const buildMenuItems = (
  menus: MenuItem[],
  options?: BuildMenuItemsOptions
): ItemType<MenuItemType>[] =>
  menus
    .filter((item) => !item.hidden)
    .map((item) => {
      const Icon = item.icon as MenuIcon | undefined
      const badgeCount = laySoBadge(item, options?.menuBadges)

      return {
        label: renderMenuLabel(item, options?.collapsed ? 0 : badgeCount),
        key: item.path || item.id,
        icon: Icon ? renderMenuIcon(Icon, badgeCount, options?.collapsed) : undefined,
        children: item.children
          ? item.children
              .filter((child) => !child.hidden)
              .map((child) => {
                const childBadgeCount = laySoBadge(child, options?.menuBadges)
                return {
                  label: renderMenuLabel(child, childBadgeCount),
                  key: child.path || child.id,
                }
              })
          : undefined,
      }
    })

export const findOpenKeys = (menus: MenuItem[], currentPath: string | null): string[] => {
  for (const item of menus) {
    if (item.children) {
      const childKeys = findOpenKeys(item.children, currentPath)
      if (childKeys.length > 0) {
        return [item.path || item.id, ...childKeys]
      }
    }
    if (item.path && currentPath) {
      const normalizedPath = item.path.replace(/\/$/, "")
      const normalizedPathname = currentPath.replace(/\/$/, "")
      if (normalizedPathname === normalizedPath || currentPath.startsWith(`${item.path}/`)) {
        return [item.path || item.id]
      }
    }
  }
  return []
}

export const findMatchingKey = (menus: MenuItem[], pathname: string | null): string | undefined => {
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
