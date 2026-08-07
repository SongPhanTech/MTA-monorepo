import type { MenuItem } from "@workspace/router"
import { Badge } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { isValidElement, type ComponentType, type ReactNode } from "react"

type MenuIconType = LucideIcon | ComponentType<{ className?: string; size?: number }> | ReactNode

type BuildMenuItemsOptions = {
  menuBadges?: Record<string, number>
  collapsed?: boolean
}

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
          className="sinh-vien-menu-badge shrink-0"
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

const renderMenuIcon = (IconComponent: MenuIconType, badgeCount: number, collapsed?: boolean) => {
  if (!IconComponent) return undefined

  let icon: ReactNode = null
  if (isValidElement(IconComponent)) {
    icon = IconComponent
  } else if (
    typeof IconComponent === "function" ||
    (typeof IconComponent === "object" && IconComponent !== null)
  ) {
    const Component = IconComponent as unknown as ComponentType<{
      className?: string
      size?: number
    }>
    icon = <Component className="sinh-vien-menu-icon" size={18} />
  } else {
    icon = IconComponent as ReactNode
  }

  if (!collapsed || badgeCount <= 0) {
    return icon
  }

  return (
    <Badge
      count={badgeCount}
      size="small"
      className="sinh-vien-menu-badge"
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
  menus.map((item) => {
    const Icon = item.icon
    const badgeCount = laySoBadge(item, options?.menuBadges)

    return {
      label: renderMenuLabel(item, options?.collapsed ? 0 : badgeCount),
      key: item.path || item.id,
      icon: Icon ? renderMenuIcon(Icon, badgeCount, options?.collapsed) : undefined,
      children: item.children
        ? item.children.map((child) => {
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
