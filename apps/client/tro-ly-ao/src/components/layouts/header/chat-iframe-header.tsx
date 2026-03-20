import { CloseOutlined, MenuOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Layout, Typography } from 'antd'
import { usePathname } from 'next/navigation'
import APPS_TYPES from '@/navigations/header-content/app_types'

const { Header } = Layout
const { Title } = Typography

interface ChatIframeHeaderProps {
    collapsed: boolean
    onCollapse: (collapsed: boolean) => void
    showCollapseButton?: boolean
    onClose?: () => void
    onExpand?: () => void
    onToggleChatWidget?: () => void
}

const ChatIframeHeader = ({
    collapsed,
    onCollapse,
    showCollapseButton = true,
    onClose,
    onExpand,
    onToggleChatWidget,
}: ChatIframeHeaderProps) => {
    const pathname = usePathname()

    const currentApp = APPS_TYPES.find((app) => {
        const paths = app.matchPaths || [app.path]
        return paths.some((path) => pathname?.startsWith(path))
    })

    const handleExpandToNewTab = () => {
        if (typeof window !== 'undefined' && pathname) {
            window.open(window.location.href, '_blank')
            if (newWindow) {
                newWindow.opener = null;
            }
            onExpand?.()
        }
    }

    const handleClose = () => {
        if (onToggleChatWidget) {
            onToggleChatWidget()
        } else if (onClose) {
            onClose()
        } else {
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                console.log('Sending TOGGLE_CHAT_WIDGET message to parent window')
                window.parent.postMessage({ type: 'TOGGLE_CHAT_WIDGET' }, '*')
            }
        }
    }

    return (
        <Header className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 h-12 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
                {showCollapseButton && (
                    <Button
                        type="text"
                        icon={collapsed ? <UnorderedListOutlined /> : <MenuOutlined />}
                        onClick={() => onCollapse(!collapsed)}
                        className="flex items-center justify-center hover:bg-gray-100"
                        title={collapsed ? 'Hiện danh sách chat' : 'Ẩn danh sách chat'}
                    />
                )}
                {currentApp && (
                    <Title level={5} className="!mb-0 !text-primary">
                        {currentApp.label}
                    </Title>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* <Button
                    type="text"
                    size="small"
                    icon={<ExportOutlined />}
                    onClick={handleExpandToNewTab}
                    className="flex items-center justify-center hover:bg-white text-gray-600 hover:text-primary transition-all duration-200 w-8 h-8 rounded-lg"
                    title="Mở trong tab mới"
                /> */}

                <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleClose}
                    className="flex items-center justify-center hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-all duration-200 w-8 h-8 rounded-lg"
                    title="Đóng chat"
                />
            </div>
        </Header>
    )
}

export default ChatIframeHeader
