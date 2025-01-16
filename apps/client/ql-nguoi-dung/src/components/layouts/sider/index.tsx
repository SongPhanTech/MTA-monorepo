import menuAntdThemeCustom from '@styles/theme/menu-antd-theme-custom'
import { ConfigProvider, Layout, Menu } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'
const { Sider } = Layout

// Định nghĩa kiểu dữ liệu cho props của SiderDefaultLayout
interface SiderDefaultLayoutProps {
    collapsed: boolean
    theme: 'light' | 'dark'
    items: any
    onCollapse?: (collapsed: boolean) => void
    logo1: ReactNode
    logo2: ReactNode
}

// Định nghĩa kiểu dữ liệu cho menu item
interface MenuItem {
    label: ReactNode
    key: string
    icon?: ReactNode
    children?: MenuItem[]
}

// Hàm hỗ trợ để tạo menu item
function getItem({
    label,
    key,
    icon,
    children,
}: {
    label: ReactNode
    key: string
    icon?: ReactNode
    children?: MenuItem[]
}): MenuItem {
    return { label, key, icon, children }
}

// Hàm hỗ trợ để chuyển đổi "item props" thành thành cấu trúc phù hợp
function getMenus(
    menus: {
        id: string
        label: string
        path?: string
        icon?: any
        children?: any[]
    }[]
): MenuItem[] {
    return menus.map((item) =>
        getItem({
            label: item.children ? (
                item.label
            ) : (
                <Link href={item.path || '#'}>{item.label}</Link>
            ),
            key: item.path || item.id,
            icon: item.icon ? <item.icon /> : undefined,
            children: item.children
                ? item.children.map((child) =>
                      getItem({
                          label: (
                              <Link href={child.path || '#'}>
                                  {child.label}
                              </Link>
                          ),
                          key: child.path || child.id,
                      })
                  )
                : undefined,
        })
    )
}

const findOpenKeys = (menus: any[], currentPath: string): string[] => {
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
            <ConfigProvider theme={menuAntdThemeCustom}>
                <Menu
                    theme={theme}
                    mode="inline"
                    selectedKeys={[pathname]}
                    openKeys={openKeys}
                    onOpenChange={(keys) => setOpenKeys(keys)} // Cập nhật trạng thái openKeys khi menu được mở/đóng
                    items={getMenus(items)}
                    style={{
                        background: 'transparent',
                    }}
                />
            </ConfigProvider>
        </Sider>
    )
}

export default SiderDefaultLayout
