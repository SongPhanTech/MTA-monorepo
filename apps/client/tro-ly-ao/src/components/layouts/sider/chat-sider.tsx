import {
    DeleteFilled,
    DeleteOutlined,
    EditOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MoreOutlined,
} from '@ant-design/icons'
import type { MenuItem } from '@workspace/router'
import { Button, Dropdown, Layout, Menu } from 'antd'
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
    onDelete?: (id: string) => void
    onEdit?: (id: string) => void
}

function getMenus(
    menus: MenuItem[],
    onDelete?: (id: string) => void,
    onEdit?: (id: string) => void
): ItemType<MenuItemType>[] {
    console.log('menus', menus)
    return menus.map((item) => {
        const key = item.id
        const dropdownMenu = [
            {
                key: 'delete',
                label: (
                    <div
                        onClick={() => onDelete?.(key)}
                        className=" text-red-500"
                    >
                        <DeleteFilled className="mr-2" />
                        Xoá
                    </div>
                ),
            },
        ]

        const label = (
            <div className="flex justify-between items-center group" key={key}>
                <span>{item.label}</span>
                <Dropdown
                    menu={{ items: dropdownMenu }}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <MoreOutlined
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-50 group-hover:opacity-100 text-gray-600 group-hover:text-gray-800 hover:text-black ml-2 cursor-pointer transition-all duration-200"
                    />
                </Dropdown>
            </div>
        )

        if (item.type === 'group' && item.children) {
            return {
                type: 'group',
                label,
                key,
                children: getMenus(item.children, onDelete, onEdit),
            }
        }

        return {
            key,
            label,
            icon: item.icon ? <item.icon /> : undefined,
            children: item.children
                ? getMenus(item.children, onDelete, onEdit)
                : undefined,
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

const findOpenKeys = (
    menus: MenuItem[],
    currentPath: string | null
): string[] => {
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

const SiderChatLayout = ({
    collapsed,
    theme,
    items,
    onCollapse,
    onDelete,
    onEdit,
}: SiderDefaultLayoutProps) => {
    const pathname = usePathname()
    const router = useRouter()
    const [openKeys, setOpenKeys] = useState<string[]>(
        findOpenKeys(items, pathname)
    )

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

    const filterFirstItem = (
        menus: MenuItem[],
        excludePath?: string
    ): MenuItem[] => {
        return menus
            .map((item) => {
                if (item.path === excludePath) return null
                if (item.children) {
                    const filteredChildren = filterFirstItem(
                        item.children,
                        excludePath
                    )
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
            collapsed={collapsed}
            theme={theme}
            width={280}
            className="h-full relative mr-[10px]"
        >
            <div className="overflow-y-auto h-full pb-[60px]">
                <div className="px-1">
                    <Button
                        color="primary"
                        variant={isActive ? 'solid' : 'outlined'}
                        className="w-full h-[40px] flex items-center justify-center gap-2 mt-2 rounded-lg"
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
                    selectedKeys={
                        pathname
                            ? [items.find((i) => i.path === pathname)?.id ?? '']
                            : []
                    }
                    openKeys={openKeys}
                    onOpenChange={setOpenKeys}
                    items={getMenus(filteredItems, onDelete, onEdit)}
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
