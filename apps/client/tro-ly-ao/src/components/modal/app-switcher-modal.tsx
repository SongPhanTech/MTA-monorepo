import {
    AppstoreOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    MessageOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import React from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import APPS_TYPES from '@/navigations/header-content/app_types'

const APP_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
    TRO_LY_AO: MessageOutlined,
    TIM_KIEM_VAN_BAN: SearchOutlined,
    XU_LY_VAN_BAN: FileTextOutlined,
    QUAN_TRI_DU_LIEU: DatabaseOutlined,
}

const AppSwitcherModal = () => {
    const pathname = usePathname()
    const router = useRouter()
    const { isOpen, onClose } = useDisclosure({
        tag: 'AppSwitcherModal',
    })

    const handleAppClick = (item: (typeof APPS_TYPES)[number]) => {
        const paths = item.matchPaths || [item.path]
        if (pathname && !paths.some((path) => pathname.startsWith(path))) {
            router.push(item.path)
            onClose()
        }
    }

    const visibleApps = APPS_TYPES.filter((item) => item.isShow)

    return (
        <Modal
            title="Chọn ứng dụng"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={320}
            className="app-switcher-modal"
            centered
        >
            <div className="grid grid-cols-1 gap-3">
                {visibleApps.map((app) => {
                    const paths = app.matchPaths || [app.path]
                    const isActive = pathname && paths.some((path) => pathname.startsWith(path))

                    return (
                        <Button
                            key={app.key}
                            size="large"
                            className={`h-14 flex items-center justify-start gap-3 text-left transition-all duration-200 ${
                                isActive
                                    ? 'bg-primary/15 text-primary border-primary/30'
                                    : 'hover:bg-primary/10 hover:text-primary border-gray-200 hover:border-primary/25'
                            }`}
                            onClick={() => handleAppClick(app)}
                            disabled={!!isActive}
                        >
                            {React.createElement(APP_ICONS[app.key] || AppstoreOutlined, {
                                style: { fontSize: '20px' },
                            })}
                            <span className="text-sm font-medium">{app.label}</span>
                        </Button>
                    )
                })}
            </div>
        </Modal>
    )
}

export default AppSwitcherModal
