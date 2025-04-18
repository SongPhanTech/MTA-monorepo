import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import type { MenuItem } from '@workspace/router'
import { Button, Layout, Menu } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useState } from 'react'

const { Sider } = Layout

interface SiderDefaultLayoutProps {
    collapsed: boolean
    theme: 'light' | 'dark'
    items: MenuItem[]
    onCollapse?: (collapsed: boolean) => void
}

// Tạo MenuItems dùng cho Ant Design <Menu />
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
    return menus.map((item) => {
        if (item.type === 'group' && item.children) {
            return {
                type: 'group',
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
const findOpenKeys = (
    menus: MenuItem[],
    currentPath: string | null
): string[] => {
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

const SiderChatLayout = ({
    collapsed,
    theme,
    items,
    onCollapse,
}: SiderDefaultLayoutProps) => {
    const pathname = usePathname()
    const router = useRouter()
    const [openKeys, setOpenKeys] = useState<string[]>(
        findOpenKeys(items, pathname)
    )

    return (
        <Sider
            collapsed={collapsed}
            theme={theme}
            width={280}
            className="h-full relative mr-[10px]"
        >
            <div className="overflow-y-auto h-full pb-[60px]">
                <Menu
                    theme={theme}
                    mode="inline"
                    selectedKeys={pathname ? [pathname] : []}
                    openKeys={openKeys}
                    onOpenChange={setOpenKeys}
                    items={getMenus(items)}
                    className="bg-transparent"
                    onClick={({ key }) => {
                        const menuItem = findMenuItemByKey(items, key)
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
