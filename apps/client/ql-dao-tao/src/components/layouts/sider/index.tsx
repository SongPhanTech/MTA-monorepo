import type { MenuItem } from '@workspace/router'
import { Layout, Menu } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'
const { Sider } = Layout

// Định nghĩa kiểu dữ liệu cho props của SiderDefaultLayout
interface SiderDefaultLayoutProps {
    collapsed: boolean
    theme: 'light' | 'dark'
    items: MenuItem[]
    onCollapse?: (collapsed: boolean) => void
    logo1: ReactNode
    logo2: ReactNode
}

// Hàm hỗ trợ để chuyển đổi "item props" thành thành cấu trúc phù hợp
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
    return menus.map((item) => ({
        label: item.children ? (
            item.label
        ) : (
            <Link href={item.path || '#'}>{item.label}</Link>
        ),
        key: item.path || item.id,
        icon: item.icon ? <item.icon /> : undefined,
        children: item.children
            ? item.children.map((child) => ({
                  label: <Link href={child.path || '#'}>{child.label}</Link>,
                  key: child.path || child.id,
              }))
            : undefined,
    }))
}

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
// Component SiderDefaultLayout
const SiderDefaultLayout = ({
    collapsed,
    theme,
    items,
    onCollapse,
    logo1,
    logo2,
}: SiderDefaultLayoutProps) => {
    const pathname = usePathname()

    // State để quản lý các menu đang mở
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
                className="pb-20"
                theme={'light'}
                mode="inline"
                selectedKeys={pathname ? [pathname] : []}
                openKeys={openKeys}
                onOpenChange={setOpenKeys} // Cập nhật trạng thái openKeys khi menu được mở/đóng
                items={getMenus(items)}
                style={{
                    background: 'transparent',
                }}
            />
        </Sider>
    )
}

export default SiderDefaultLayout
