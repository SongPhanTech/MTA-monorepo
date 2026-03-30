import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons"
import type { MenuItem } from "@workspace/router"
import { Button, Layout, Menu } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { useState } from "react"

const { Sider } = Layout

interface SiderDefaultLayoutProps {
  collapsed: boolean
  theme: "light" | "dark"
  items: MenuItem[]
  onCollapse?: (collapsed: boolean) => void
}

// Tạo MenuItems dùng cho Ant Design <Menu />
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
  return menus.map((item) => {
    if (item.type === "group" && item.children) {
      return {
        type: "group",
        label: item.label,
        key: item.id,
        children: item.children.map((child) => ({
          key: child.path || child.id,
          label: child.label,
        })),
      }
    }

    return {
      key: item.path || item.id,
      label: item.label,
      icon: item.icon ? <item.icon /> : undefined,
      children: item.children ? getMenus(item.children) : undefined,
    }
  })
}

// Tìm menu theo key để lấy path
const findMenuItemByKey = (menus: MenuItem[], key: string): MenuItem | null => {
  for (const item of menus) {
    if ((item.path || item.id) === key) {
      return item
    }
    if (item.children) {
      const found = findMenuItemByKey(item.children, key)
      if (found) return found
    }
  }
  return null
}

// Tìm openKeys dựa vào path hiện tại
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

const SiderChatLayout = ({ collapsed, theme, items, onCollapse }: SiderDefaultLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))

  // Tìm item đầu tiên hợp lệ
  const getFirstValidItem = (menus: MenuItem[]): MenuItem | null => {
    for (const item of menus) {
      if (item.path) return item
      if (item.children) {
        const child = getFirstValidItem(item.children)
        if (child) return child
      }
    }
    return null
  }

  const firstItem = getFirstValidItem(items)

  // Filter menu để loại bỏ item đầu tiên khỏi menu
  const filterFirstItem = (menus: MenuItem[], excludePath: string | undefined): MenuItem[] => {
    return menus
      .map((item) => {
        if (item.path === excludePath) return null
        if (item.children) {
          const filteredChildren = filterFirstItem(item.children, excludePath)
          if (filteredChildren.length === 0) return null
          return { ...item, children: filteredChildren }
        }
        return item
      })
      .filter(Boolean) as MenuItem[]
  }

  const filteredItems = filterFirstItem(items, firstItem?.path)

  // Xử lý active status khi user click vào Button
  const isActive = pathname === firstItem?.path

  return (
    <Sider collapsed={collapsed} theme={theme} width={280} className="h-full relative mr-[10px]">
      <div className="overflow-y-auto h-full pb-[60px]">
        <div className="px-1">
          <Button
            color={"primary"}
            variant={isActive ? "solid" : "outlined"}
            className={"w-full h-[40px] flex items-center justify-center gap-2 mt-2 rounded-lg"}
            icon={firstItem?.icon ? <firstItem.icon /> : undefined}
            onClick={() => {
              if (firstItem?.path) router.push(firstItem.path)
            }}
          >
            {!collapsed && firstItem?.label}
          </Button>
        </div>

        <Menu
          theme={theme}
          mode="inline"
          selectedKeys={pathname ? [pathname] : []}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={getMenus(filteredItems)}
          className="bg-transparent"
          onClick={({ key }) => {
            const menuItem = findMenuItemByKey(filteredItems, key)
            if (menuItem?.path) {
              router.push(menuItem.path)
            }
          }}
        />
      </div>

      <div className="absolute bottom-0 w-full flex justify-center z-10">
        <Button
          type="text"
          className="w-full bg-white text-primary text-lg rounded-none"
          onClick={() => onCollapse?.(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
      </div>
    </Sider>
  )
}
export default SiderChatLayout
