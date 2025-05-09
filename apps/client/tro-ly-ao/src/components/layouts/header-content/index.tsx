import { UnorderedListOutlined } from '@ant-design/icons'
import { Button, Dropdown, Menu } from 'antd'
import { useRouter } from 'next/router'
import APPS_TYPES from '@constants/app_types'

function HeaderContent() {
    const router = useRouter()
    const currentPath = router.pathname

    // Trả về true nếu path hiện tại thuộc 1 trong các matchPaths
    const isActive = (item: (typeof APPS_TYPES)[number]) => {
        const paths = item.matchPaths || [item.path]
        return paths.some((path) => currentPath.startsWith(path))
    }

    const handleClick = (item: (typeof APPS_TYPES)[number]) => {
        const paths = item.matchPaths || [item.path]
        if (!paths.some((path) => currentPath.startsWith(path))) {
            router.push(item.path)
        }
    }

    const visibleList = APPS_TYPES.filter((item) => item.isShow)
    const moreList = APPS_TYPES.filter((item) => !item.isShow)

    const menu = (
        <Menu>
            {moreList.map((item) => (
                <Menu.Item
                    key={item.key}
                    onClick={() => handleClick(item)}
                    style={{
                        fontWeight: isActive(item) ? 'bold' : 'normal',
                        backgroundColor: isActive(item) ? '#e6f4ff' : undefined,
                    }}
                >
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    )

    return (
        <div className="h-[60px] p-[8px] mb-2 bg-white flex items-center justify-start border-primary">
            <div className="flex items-center gap-2">
                {visibleList.map((item) => (
                    <Button
                        key={item.key}
                        size="large"
                        type={isActive(item) ? 'primary' : 'default'}
                        onClick={() => handleClick(item)}
                    >
                        {item.label}
                    </Button>
                ))}
                {moreList.length > 0 && (
                    <Dropdown overlay={menu} trigger={['click']}>
                        <Button icon={<UnorderedListOutlined />} size="large" />
                    </Dropdown>
                )}
            </div>
        </div>
    )
}

export default HeaderContent
