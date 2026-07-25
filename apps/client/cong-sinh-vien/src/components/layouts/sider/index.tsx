import {
  buildMenuItems,
  findMatchingKey,
  findOpenKeys,
} from "@components/layouts/sider/utils"
import type { MenuItem } from "@workspace/router"
import { Layout, Menu } from "antd"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

const { Sider } = Layout

const SIDER_WIDTH = 250
const SIDER_COLLAPSED_WIDTH = 80
const HEADER_HEIGHT = 64

interface SiderDefaultLayoutProps {
  collapsed: boolean
  items: MenuItem[]
  menuBadges?: Record<string, number>
}

const SiderDefaultLayout = ({ collapsed, items, menuBadges }: SiderDefaultLayoutProps) => {
  const router = useRouter()
  const pathname = router.pathname
  const [openKeys, setOpenKeys] = useState<string[]>(() => findOpenKeys(items, pathname))

  const selectedKeys = useMemo(() => {
    const cleanPathname = pathname?.split("?")[0].split("#")[0] || "/"
    const matched = findMatchingKey(items, cleanPathname)
    return matched ? [matched] : [cleanPathname]
  }, [items, pathname])

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([])
      return
    }
    setOpenKeys(findOpenKeys(items, pathname))
  }, [collapsed, items, pathname])

  return (
    <Sider
      className="sinh-vien-sider"
      style={{
        overflow: "auto",
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        position: "fixed",
        insetInlineStart: 0,
        top: HEADER_HEIGHT,
        bottom: 0,
        scrollbarWidth: "thin",
      }}
      collapsible
      trigger={null}
      collapsed={collapsed}
      theme="light"
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
    >
      <Menu
        className="sinh-vien-sider-menu"
        theme="light"
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={buildMenuItems(items, { menuBadges, collapsed })}
      />
    </Sider>
  )
}

export default SiderDefaultLayout
