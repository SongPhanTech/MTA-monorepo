import { MoreOutlined } from '@ant-design/icons'
import type { MenuItem } from '@workspace/router'
import { Layout, Menu, Dropdown } from 'antd'
import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { useRouter } from 'next/router'
import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const { Sider } = Layout

// Định nghĩa kiểu dữ liệu cho props của SiderDefaultLayout
interface SiderDefaultLayoutProps {
    collapsed: boolean
    theme: 'light' | 'dark'
    items: MenuItem[]
    onCollapse?: (collapsed: boolean) => void
    logo1: React.ReactNode
    logo2: React.ReactNode
}

// Định nghĩa kiểu cho hàm onDelete
type OnDelete = (id: string) => void

// Tạo component cho dropdown của MoreOutlined để tránh gọi lại getMenus
const MoreDropdown = ({ onDelete, childId }: { onDelete: OnDelete, childId: string }) => {
    return (
        <Dropdown
            trigger={['click']}
            overlay={
                <Menu>
                    <Menu.Item key="edit" onClick={() => onDelete(childId)}>
                        Chỉnh sửa
                    </Menu.Item>
                    <Menu.Item key="delete" danger onClick={() => console.log('Xoá', childId)}>
                        Xoá
                    </Menu.Item>
                </Menu>
            }
        >
            <MoreOutlined className="text-gray-400 hover:text-blue-500 cursor-pointer ml-2" />
        </Dropdown>
    )
}

// Hàm hỗ trợ để chuyển đổi "item props" thành cấu trúc phù hợp
function getMenus(menus: MenuItem[], onDelete: OnDelete): ItemType<MenuItemType>[] {
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
                            className="flex items-center justify-between pr-2 group cursor-pointer"
                            onClick={(e) => {
                                // Nếu bạn click vào label thì nó sẽ điều hướng
                                if (child.path) {
                                    router.push(child.path)
                                }
                            }}
                        >
                            <div className="flex-1 truncate">{child.label}</div>
                            <MoreDropdown onDelete={onDelete} childId={child.id} />
                        </div>
                    ),
                })),
            }
        }

        return {
            label: item.children ? (
                item.label
            ) : (
                <div
                    onClick={(e) => {
                        // Ngừng sự kiện nếu click vào item mà không muốn điều hướng
                        e.stopPropagation()

                        if (item.path) {
                            router.push(item.path)
                        }
                    }}
                    className="cursor-pointer hover:text-blue-500"
                >
                    {item.label}
                </div>
            ),
            key: item.path || item.id,
            icon: item.icon ? <item.icon /> : undefined,
            children: item.children ? getMenus(item.children, onDelete) : undefined,
        }
    })
}

// Hàm tìm các menu được mở
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

    const handleDelete: OnDelete = useCallback((id: string) => {
        // Xử lý xóa hội thoại tại đây
        console.log('Xoá hội thoại với id:', id)
    }, [])

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
                theme={'light'}
                mode="inline"
                selectedKeys={pathname ? [pathname] : []}
                openKeys={openKeys}
                onOpenChange={setOpenKeys} // Cập nhật trạng thái openKeys khi menu được mở/đóng
                items={getMenus(items, handleDelete)}
                style={{
                    background: 'transparent',
                }}
            />
        </Sider>
    )
}

export default SiderDefaultLayout