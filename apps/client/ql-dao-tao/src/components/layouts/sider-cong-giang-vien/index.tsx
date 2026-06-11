import type { CongGiangVienMenuItem } from "@constants/cong-giang-vien-menu"
import { Badge, Layout, Menu } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

const { Sider } = Layout

export const CONG_GIANG_VIEN_SIDER_WIDTH = 280
export const CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH = 80
export const CONG_GIANG_VIEN_HEADER_HEIGHT = 64

interface SiderCongGiangVienProps {
  collapsed: boolean
  items: CongGiangVienMenuItem[]
  onCollapse?: (collapsed: boolean) => void
}

const renderMenuLabel = (item: CongGiangVienMenuItem, isSubmenu = false) => {
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
    <Link href={item.path || "#"} className={`block min-w-0 truncate ${isSubmenu ? "" : ""}`}>
      {content}
    </Link>
  )
}

function getMenus(menus: CongGiangVienMenuItem[]): ItemType<MenuItemType>[] {
  return menus.map((item) => ({
    label: renderMenuLabel(item),
    key: item.path || item.id,
    icon: item.icon ? <item.icon className="giang-vien-menu-icon" size={18} /> : undefined,
    children: item.children
      ? item.children.map((child) => ({
          label: renderMenuLabel(child, true),
          key: child.path || child.id,
        }))
      : undefined,
  }))
}

const findOpenKeys = (menus: CongGiangVienMenuItem[], currentPath: string | null): string[] => {
  for (const item of menus) {
    if (item.children) {
      const childKeys = findOpenKeys(item.children, currentPath)
      if (childKeys.length > 0) {
        return [item.path || item.id, ...childKeys]
      }
      for (const child of item.children) {
        if (child.path === currentPath) {
          return [item.id]
        }
      }
    }
    if (item.path === currentPath) {
      return [item.path || item.id]
    }
  }
  return []
}

const findMatchingKey = (
  menus: CongGiangVienMenuItem[],
  pathname: string | null
): string | undefined => {
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

const SiderCongGiangVien = ({ collapsed, items, onCollapse }: SiderCongGiangVienProps) => {
  const router = useRouter()
  const pathname = router.pathname
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))

  const selectedKeys = useMemo(() => {
    const cleanPathname = pathname?.split("?")[0].split("#")[0] || "/"
    const matched = findMatchingKey(items, cleanPathname)
    return matched ? [matched] : [cleanPathname]
  }, [items, pathname])

  return (
    <Sider
      className="giang-vien-sider"
      style={{
        overflow: "auto",
        height: `calc(100vh - ${CONG_GIANG_VIEN_HEADER_HEIGHT}px)`,
        position: "fixed",
        insetInlineStart: 0,
        top: CONG_GIANG_VIEN_HEADER_HEIGHT,
        bottom: 0,
        scrollbarWidth: "thin",
      }}
      collapsible
      trigger={null}
      onCollapse={onCollapse}
      collapsed={collapsed}
      theme="light"
      width={CONG_GIANG_VIEN_SIDER_WIDTH}
      collapsedWidth={CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH}
    >
      <Menu
        className="giang-vien-sider-menu"
        theme="light"
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={getMenus(items)}
      />
    </Sider>
  )
}

export default SiderCongGiangVien
