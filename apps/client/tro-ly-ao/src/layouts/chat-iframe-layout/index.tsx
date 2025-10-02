import ChatIframeHeader from '@components/layouts/header/chat-iframe-header'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { cn } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import {
    useDeleteConversation,
    useDeleteManyMessage,
    useFindManyConversation,
} from '@workspace/db/hooks'
import { Layout, message, Spin } from 'antd'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import { useUserSession } from '@/hooks/useUserSession'
import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'

const { Content } = Layout

interface ChatIframeLayoutProps {
    children: ReactNode
    className?: string
    showSiderChat?: boolean
    onClose?: () => void
    onExpand?: () => void
}

const ChatIframeLayout = ({
    children,
    className,
    showSiderChat = true,
    onClose,
    onExpand,
}: ChatIframeLayoutProps) => {
    const router = useRouter()
    const { sessionId } = useUserSession()
    const [isDeleting, setIsDeleting] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768
            const storedCollapsed = localStorage.getItem('chat-iframe-sider-collapsed') === 'true'
            return isMobile ? true : storedCollapsed
        }
        return false
    })

    const { data: userCurrent } = useSession()

    const handleCollapsed = (value?: boolean) => {
        if (typeof window !== 'undefined') {
            const newValue = value ?? !collapsed
            setCollapsed(newValue)
            if (window.innerWidth >= 768) {
                localStorage.setItem('chat-iframe-sider-collapsed', newValue.toString())
            }
        }
    }

    const { mutateAsync: deleteConversation } = useDeleteConversation()
    const { mutateAsync: deleteManyMessages } = useDeleteManyMessage()

    const handleDelete = async (id: string) => {
        if (!id) return
        const realId = id.split('-')[1]
        setIsDeleting(true)
        try {
            await deleteManyMessages({ where: { conversationId: realId } })
            await deleteConversation({ where: { id: realId } })
            message.success('Đã xóa cuộc trò chuyện')
            router.push('/tro-ly-ao')
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        } finally {
            setIsDeleting(false)
        }
    }

    // Initialize responsive collapse on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768
            if (isMobile) {
                setCollapsed(true)
            }
        }
    }, [])

    const { data: conversation } = useFindManyConversation({
        where: {
            sessionId: sessionId || '',
        },
        include: {
            message: true,
        },
    })

    const conversationMenuList: ConversationDataFromAPI = (conversation || []).map((item) => ({
        id: item.id,
        label: item.message?.[0]?.content || 'Đang tải...',
    }))

    return (
        <Layout className="h-screen">
            <Layout className="overflow-hidden flex flex-col">
                <ChatIframeHeader
                    collapsed={collapsed}
                    onCollapse={handleCollapsed}
                    showCollapseButton={showSiderChat}
                    onClose={onClose}
                    onExpand={onExpand}
                />
                <Layout className="flex-1">
                    {showSiderChat && (
                        <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden h-full border-r border-gray-200 ${!collapsed ? 'w-[290px] opacity-100' : 'w-0 opacity-0'}`}
                        >
                            <div
                                className={`transition-opacity duration-300 h-full ${!collapsed ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <SiderChatLayout
                                    items={generateMenusTroLyAo(conversationMenuList)}
                                    theme={'light'}
                                    onDelete={handleDelete}
                                />
                            </div>
                        </div>
                    )}
                    <Content className={cn('flex-1 bg-white relative overflow-hidden', className)}>
                        {isDeleting && (
                            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <Spin size="large" tip="Đang xoá..." />
                            </div>
                        )}
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    )
}

export default ChatIframeLayout
