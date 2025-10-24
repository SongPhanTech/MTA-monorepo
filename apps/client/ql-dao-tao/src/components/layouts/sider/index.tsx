import type { MenuItem } from '@workspace/router'
import { Menu } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Định nghĩa kiểu dữ liệu cho props của SiderDefaultLayout
interface SiderDefaultLayoutProps {
    theme: 'light' | 'dark'
    items: MenuItem[]
}

// Hàm hỗ trợ để chuyển đổi "item props" thành thành cấu trúc phù hợp
function getMenus(menus: MenuItem[]): ItemType<MenuItemType>[] {
    return menus.map((item) => ({
        label: item.children ? (
            item.label
        ) : (
            <Link href={item.path || '#'} className="flex items-center gap-2">
                {item.icon ? <item.icon /> : undefined}
                {item.label}
            </Link>
        ),
        key: item.path || item.id,
        children: item.children
            ? item.children.map((child) => ({
                  label: (
                      <Link href={child.path || '#'} className="flex items-center gap-2">
                          {child.icon ? <child.icon /> : undefined}
                          {child.label}
                      </Link>
                  ),
                  key: child.path || child.id,
                  children: child.children
                      ? child.children.map((grandChild) => ({
                            label: (
                                <Link
                                    href={grandChild.path || '#'}
                                    className="flex items-center gap-2"
                                >
                                    {grandChild.icon ? <grandChild.icon /> : undefined}
                                    {grandChild.label}
                                </Link>
                            ),
                            key: grandChild.path || grandChild.id,
                        }))
                      : undefined,
              }))
            : undefined,
    }))
}

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
const SidebarMenuLayout = ({ items }: SiderDefaultLayoutProps) => {
    const pathname = usePathname()
    return (
        <Menu
            theme={'light'}
            mode="horizontal"
            className="mt-14"
            selectedKeys={pathname ? [pathname] : []}
            items={getMenus(items)}
            style={{
                background: 'white',
                borderTop: '1px solid #f1f1f1',
            }}
        />
    )
}

export default SidebarMenuLayout
