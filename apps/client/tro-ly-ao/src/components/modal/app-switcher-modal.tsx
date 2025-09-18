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
            width={400}
            className="app-switcher-modal"
            centered
        >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                {visibleApps.map((app) => (
                    <Button
                        key={app.key}
                        size="large"
                        className="h-16 flex flex-col items-center justify-center gap-1 text-center hover:bg-primary/10 hover:text-primary transition-all duration-200 border-gray-200 hover:border-primary/25"
                        icon={React.createElement(APP_ICONS[app.key] || AppstoreOutlined, {
                            style: { fontSize: '24px' },
                        })}
                        onClick={() => handleAppClick(app)}
                    >
                        <span className="text-xs font-medium leading-tight">{app.label}</span>
                    </Button>
                ))}
            </div>
        </Modal>
    )
}

export default AppSwitcherModal
