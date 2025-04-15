import type { MenuItem } from '@workspace/router'
import { Layout, Menu } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const { Sider } = Layout

interface SiderDefaultLayoutProps {
    collapsed: boolean
    theme: 'light' | 'dark'
    items: MenuItem[]
    onCollapse?: (collapsed: boolean) => void
    logo1: React.ReactNode
    logo2: React.ReactNode
}

// Chuyển đổi item sang định dạng Menu phù hợp
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
    const router = useRouter()

    return menus.map((item) => {
        if (item.type === 'group' && item.children) {
            return {
                type: 'group',
                label: item.label,
                key: item.id,
                children: item.children.map((child) => ({
                    key: child.path || child.id,
                    label: (
                        <div
                            className="cursor-pointer"
                            onClick={() => {
                                if (child.path) {
                                    router.push(child.path)
                                }
                            }}
                        >
                            {child.label}
                        </div>
                    ),
                })),
            }
        }

        return {
            label: (
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        if (item.path) {
                            router.push(item.path)
                        }
                    }}
                >
                    {item.label}
                </div>
            ),
            key: item.path || item.id,
            icon: item.icon ? <item.icon /> : undefined,
            children: item.children ? getMenus(item.children) : undefined,
        }
    })
}

// Tìm các menu mở sẵn theo pathname
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

const SiderDefaultLayout = ({
    collapsed,
    theme,
    items,
    onCollapse,
    logo1,
    logo2,
}: SiderDefaultLayoutProps) => {
    const pathname = usePathname()
    const [openKeys, setOpenKeys] = useState<string[]>(
        findOpenKeys(items, pathname)
    )

    return (
        <Sider
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                scrollbarWidth: 'none',
            }}
            collapsible
            onCollapse={onCollapse}
            collapsed={collapsed}
            theme={theme}
            width={280}
        >
            <div className="flex items-center justify-center my-3">
                {collapsed ? logo1 : logo2}
            </div>
            <Menu
                theme={theme}
                mode="inline"
                selectedKeys={pathname ? [pathname] : []}
                openKeys={openKeys}
                onOpenChange={setOpenKeys}
                items={getMenus(items)}
                style={{
                    background: 'transparent',
                }}
            />
        </Sider>
    )
}

export default SiderDefaultLayout