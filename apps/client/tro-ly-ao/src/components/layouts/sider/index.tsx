import type { MenuItem } from '@workspace/router'
import { Layout, Menu } from 'antd'
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

// Chuyển đổi item sang định dạng Menu phù hợp
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
            label: item.label,
            key: item.path || item.id,
            icon: item.icon ? <item.icon /> : undefined,
            children: item.children ? getMenus(item.children) : undefined,
        }
    })
}

function findItemByKey(menus: MenuItem[], key: string): MenuItem | undefined {
    for (const item of menus) {
        if ((item.path || item.id) === key) return item
        if (item.children) {
            const found = findItemByKey(item.children, key)
            if (found) return found
        }
    }
}

// Tìm các menu mở sẵn theo pathname
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

const SiderDefaultLayout = ({ collapsed, theme, items, onCollapse }: SiderDefaultLayoutProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(items, pathname))
    return (
        <Sider
            style={{
                height: '90vh',
                position: 'fixed',
                overflow: 'hidden',
            }}
            className="rounded-xl ml-2"
            collapsible
            onCollapse={onCollapse}
            collapsed={collapsed}
            theme={theme}
            width={280}
        >
            <Menu
                theme={theme}
                mode="inline"
                selectedKeys={pathname ? [pathname] : []}
                openKeys={openKeys}
                onOpenChange={(keys) => {
                    // Chỉ cho phép mở một menu tại một thời điểm
                    const latestKey = keys.find((key) => !openKeys.includes(key))
                    setOpenKeys(latestKey ? [latestKey] : [])
                }}
                items={getMenus(items)}
                style={{ background: 'transparent' }}
                onClick={({ key }) => {
                    // tìm path tương ứng trong items
                    const target = findItemByKey(items, key)
                    if (target?.path) {
                        router.push(target.path)
                    }
                }}
            />
        </Sider>
    )
}

export default SiderDefaultLayout
