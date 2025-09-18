import {
    AppstoreOutlined,
    ExportOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Layout, Typography } from 'antd'
import { usePathname } from 'next/navigation'
import { useDisclosure } from 'react-hook-disclosure-modal'
import APPS_TYPES from '@/navigations/header-content/app_types'

const { Header } = Layout
const { Title } = Typography

interface ChatHeaderProps {
    collapsed: boolean
    onCollapse: (collapsed: boolean) => void
    showCollapseButton?: boolean
}

const ChatHeader = ({ collapsed, onCollapse, showCollapseButton = true }: ChatHeaderProps) => {
    const pathname = usePathname()
    const { onOpen: openAppModal } = useDisclosure({
        tag: 'AppSwitcherModal',
    })

    const currentApp = APPS_TYPES.find((app) => {
        const paths = app.matchPaths || [app.path]
        return paths.some((path) => pathname?.startsWith(path))
    })

    const isInIframe = typeof window !== 'undefined' && window.self !== window.top

    const handleExpandToNewTab = () => {
        if (typeof window !== 'undefined' && pathname) {
            window.open(window.location.href, '_blank')
        }
    }

    return (
        <Header className="bg-white rounded-xl px-4 h-14 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                {showCollapseButton && (
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => onCollapse(!collapsed)}
                        className="flex items-center justify-center hover:bg-gray-100"
                    />
                )}
                <Button
                    type="text"
                    icon={<AppstoreOutlined />}
                    onClick={openAppModal}
                    className="flex items-center justify-center text-primary bg-primary/8 border border-primary/15 hover:bg-primary/12 hover:border-primary/25 transition-all duration-200"
                />
                {currentApp && (
                    <Title level={5} className="!mb-0 !text-primary">
                        {currentApp.label}
                    </Title>
                )}
            </div>

            {isInIframe && (
                <Button
                    type="text"
                    icon={<ExportOutlined />}
                    onClick={handleExpandToNewTab}
                    className="flex items-center justify-center hover:bg-primary/10 hover:text-primary text-gray-500 transition-all duration-200"
                    title="Mở trong tab mới"
                />
            )}
        </Header>
    )
}

export default ChatHeader
