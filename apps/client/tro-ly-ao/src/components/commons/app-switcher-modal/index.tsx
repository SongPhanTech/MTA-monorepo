import {
    AppstoreOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    MessageOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { FloatButton } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'
import APPS_TYPES from '@/navigations/header-content/app_types'

// Map app keys to their corresponding icons
const APP_ICONS: Record<string, React.ComponentType> = {
    TRO_LY_AO: MessageOutlined,
    TIM_KIEM_VAN_BAN: SearchOutlined,
    XU_LY_VAN_BAN: FileTextOutlined,
    QUAN_TRI_DU_LIEU: DatabaseOutlined,
}

export default function AppSwitcherFloatButton() {
    const router = useRouter()
    const currentPath = router.pathname

    const handleAppClick = (item: (typeof APPS_TYPES)[number]) => {
        const paths = item.matchPaths || [item.path]
        if (!paths.some((path) => currentPath.startsWith(path))) {
            router.push(item.path)
        }
    }

    const visibleList = APPS_TYPES.filter((item) => item.isShow)

    return (
        <FloatButton.Group
            trigger="click"
            type="primary"
            style={{ right: 24, bottom: 24 }}
            icon={<AppstoreOutlined />}
            // tooltip="Ứng dụng"
        >
            {visibleList.map((item) => (
                <FloatButton
                    key={item.key}
                    icon={React.createElement(APP_ICONS[item.key] || AppstoreOutlined)}
                    tooltip={item.label}
                    onClick={() => handleAppClick(item)}
                />
            ))}
        </FloatButton.Group>
    )
}
