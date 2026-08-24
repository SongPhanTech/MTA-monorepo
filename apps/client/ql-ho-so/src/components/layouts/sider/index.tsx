import { buildMenuItems, findMatchingKey, findOpenKeys } from "@components/layouts/sider/utils"
import {
  QL_HO_SO_HEADER_HEIGHT,
  QL_HO_SO_SIDER_COLLAPSED_WIDTH,
  QL_HO_SO_SIDER_WIDTH,
} from "@constants/ql-ho-so-layout"
import type { MenuItem } from "@workspace/router"
import { Layout, Menu } from "antd"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

const { Sider } = Layout

interface SiderHoSoProps {
  collapsed: boolean
  items: MenuItem[]
  menuBadges?: Record<string, number>
}

const SiderHoSo = ({ collapsed, items, menuBadges }: SiderHoSoProps) => {
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
      className="ho-so-sider"
      style={{
        overflow: "auto",
        height: `calc(100vh - ${QL_HO_SO_HEADER_HEIGHT}px)`,
        position: "fixed",
        insetInlineStart: 0,
        top: QL_HO_SO_HEADER_HEIGHT,
        bottom: 0,
        scrollbarWidth: "thin",
      }}
      collapsible
      trigger={null}
      collapsed={collapsed}
      theme="light"
      width={QL_HO_SO_SIDER_WIDTH}
      collapsedWidth={QL_HO_SO_SIDER_COLLAPSED_WIDTH}
    >
      <Menu
        className="ho-so-sider-menu"
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

export default SiderHoSo
