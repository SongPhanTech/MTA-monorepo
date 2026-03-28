import { DeleteOutlined, MoreOutlined } from "@ant-design/icons"
import type { MenuItem } from "@workspace/router"
import { Button, Dropdown, Layout, Menu } from "antd"
import type { ItemType, MenuItemType } from "antd/es/menu/interface"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { useState } from "react"

const { Sider } = Layout

interface SiderDefaultLayoutProps {
  theme: "light" | "dark"
  items: MenuItem[]
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

function getMenus(
  menus: MenuItem[],
  onDelete?: (id: string) => void,
  onEdit?: (id: string) => void
): ItemType<MenuItemType>[] {
  return menus.map((item) => {
    const key = item.id
    const dropdownMenu = {
      items: [
        {
          key: "delete",
          label: (
            <span className="text-red-500">
              <DeleteOutlined className="mr-2" />
              Xoá
            </span>
          ),
        },
      ],
      onClick: ({ key: actionKey }: { key: string }) => {
        if (actionKey === "delete") {
          onDelete?.(key)
        }
      },
    }

    const label = (
      <div className="flex justify-between items-center group w-full" key={key}>
        <span className="truncate max-w-[180px]">{item.label}</span>
        <Dropdown menu={dropdownMenu} trigger={["click"]} placement="bottomRight">
          <MoreOutlined
            onClick={(e) => e.stopPropagation()}
            className="opacity-50 group-hover:opacity-100 text-gray-600 group-hover:text-gray-800 hover:text-black ml-2 cursor-pointer transition-all duration-200"
          />
        </Dropdown>
      </div>
    )

    if (item.type === "group" && item.children) {
      return {
        type: "group",
        label,
        key,
        children: getMenus(item.children, onDelete, onEdit),
      }
    }

    return {
      key,
      label,
      icon: item.icon ? <item.icon /> : undefined,
      children: item.children ? getMenus(item.children, onDelete, onEdit) : undefined,
    }
  })
}

const findMenuItemByKey = (menus: MenuItem[], key: string): MenuItem | null => {
  for (const item of menus) {
    if (item.id === key) return item
    if (item.children) {
      const found = findMenuItemByKey(item.children, key)
      if (found) return found
    }
  }
  return null
}

const findOpenKeys = (menus: MenuItem[], currentPath: string | null): string[] => {
  for (const item of menus) {
    if (item.children) {
      const childKeys = findOpenKeys(item.children, currentPath)
      if (childKeys.length > 0) {
        return [item.id, ...childKeys]
      }
    }
    if (item.path === currentPath) {
      return [item.id]
    }
  }
  return []
}

const SiderChatLayout = ({ theme, items, onDelete, onEdit }: SiderDefaultLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))

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

  const filterFirstItem = (menus: MenuItem[], excludePath?: string): MenuItem[] => {
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

  const firstItem = getFirstValidItem(items)
  const filteredItems = filterFirstItem(items, firstItem?.path)
  const isActive = pathname === firstItem?.path

  return (
    <Sider
      style={{
        height: "100%",
        overflow: "hidden",
      }}
      className="mr-[10px] rounded-xl max-md:mr-0 max-md:rounded-none"
      theme={theme}
      width={280}
    >
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="px-1 pt-2">
            <Button
              className={`w-full h-[40px] flex items-center justify-center gap-2 rounded-lg border transition-colors ${
                isActive
                  ? "bg-primary text-white border-primary hover:bg-primary/90"
                  : "bg-transparent text-primary border-primary hover:bg-primary/10"
              }`}
              icon={firstItem?.icon ? <firstItem.icon /> : undefined}
              onClick={() => {
                if (firstItem?.path && !isActive) {
                  router.push(firstItem.path)
                }
              }}
            >
              {firstItem?.label}
            </Button>
          </div>

          <Menu
            theme={theme}
            mode="inline"
            selectedKeys={pathname ? [items.find((i) => i.path === pathname)?.id ?? ""] : []}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={getMenus(filteredItems, onDelete, onEdit)}
            style={{ background: "transparent" }}
            onClick={({ key }) => {
              const menuItem = findMenuItemByKey(filteredItems, key)
              if (menuItem?.path) {
                router.push(menuItem.path)
              }
            }}
          />
        </div>
      </div>
    </Sider>
  )
}

export default SiderChatLayout
