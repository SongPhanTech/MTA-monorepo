import {
  buildMenuItems,
  findMatchingKey,
  findOpenKeys,
} from "@components/layouts/sider-cong-giang-vien/utils"
import type { CongGiangVienMenuItem } from "@constants/cong-giang-vien-menu"
import {
  CONG_GIANG_VIEN_HEADER_HEIGHT,
  CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH,
  CONG_GIANG_VIEN_SIDER_WIDTH,
} from "@constants/cong-giang-vien-layout"
import { Layout, Menu } from "antd"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

const { Sider } = Layout

interface SiderCongGiangVienProps {
  collapsed: boolean
  items: CongGiangVienMenuItem[]
}

const SiderCongGiangVien = ({ collapsed, items }: SiderCongGiangVienProps) => {
  const router = useRouter()
  const pathname = router.pathname
  const [openKeys, setOpenKeys] = useState<string[]>(() => findOpenKeys(items, pathname))

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
        items={buildMenuItems(items)}
      />
    </Sider>
  )
}

export default SiderCongGiangVien
