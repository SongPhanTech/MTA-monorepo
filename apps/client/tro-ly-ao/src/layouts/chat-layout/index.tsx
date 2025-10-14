import ChatHeader from '@components/layouts/header/chat-header'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import ChatIframeLayout from '@layouts/chat-iframe-layout'
import { cn } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import {
    useDeleteConversation,
    useDeleteManyCitationMessage,
    useDeleteManyMessage,
    useFindManyConversation,
} from '@workspace/db/hooks'
import { Layout, message, Spin } from 'antd'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import { useUserSession } from '@/hooks/useUserSession'
import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'

const { Header, Content } = Layout

const ChatLayout = ({
    children,
    className,
    showSiderChat = true,
}: {
    children: ReactNode
    className?: string
    showSiderChat?: boolean
}) => {
    const router = useRouter()
    const { sessionId } = useUserSession()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isInIframe, setIsInIframe] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768
            const storedCollapsed = localStorage.getItem('chat-sider-collapsed') === 'true'
            return isMobile ? true : storedCollapsed
        }
        return false
    })

    const { data: userCurrent } = useSession()

    // Check if running in iframe
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsInIframe(window.self !== window.top)
        }
    }, [])

    const handleCollapsed = (value?: boolean) => {
        if (typeof window !== 'undefined') {
            const newValue = value ?? !collapsed
            setCollapsed(newValue)
            if (window.innerWidth >= 768) {
                localStorage.setItem('chat-sider-collapsed', newValue.toString())
            }
        }
    }
    const { mutateAsync: deleteConversation } = useDeleteConversation()
    const { mutateAsync: deleteManyMessages } = useDeleteManyMessage()
    const { mutateAsync: deleteManyCitations } = useDeleteManyCitationMessage()

    const handleDelete = async (id: string) => {
        if (!id) return
        const realId = id.split('-')[1]
        setIsDeleting(true)
        try {
            // Delete citations first (they reference messages)
            await deleteManyCitations({
                where: {
                    message: {
                        conversationId: realId,
                    },
                },
            })
            // Then delete messages
            await deleteManyMessages({ where: { conversationId: realId } })
            // Finally delete conversation
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

    // Iframe handlers
    const handleIframeClose = () => {
        console.log('handleIframeClose called in ChatLayout')
        if (typeof window !== 'undefined' && window.parent) {
            console.log('Sending TOGGLE_CHAT_WIDGET message to parent')
            window.parent.postMessage({ type: 'TOGGLE_CHAT_WIDGET' }, '*')
        } else {
            console.log('window.parent not available')
        }
    }

    const handleIframeExpand = () => {
        if (typeof window !== 'undefined' && window.parent) {
            window.parent.postMessage({ type: 'EXPAND_CHAT' }, '*')
        }
    }

    // If in iframe, use ChatIframeLayout
    if (isInIframe) {
        return (
            <ChatIframeLayout
                className={className}
                showSiderChat={showSiderChat}
                onClose={handleIframeClose}
                onExpand={handleIframeExpand}
            >
                {isDeleting && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <Spin size="large" tip="Đang xoá..." />
                    </div>
                )}
                {children}
            </ChatIframeLayout>
        )
    }

    return (
        <Layout className="h-screen p-[10px]">
            <Layout className="overflow-hidden flex flex-col">
                <ChatHeader
                    collapsed={collapsed}
                    onCollapse={handleCollapsed}
                    showCollapseButton={showSiderChat}
                />
                <Layout className="flex-1">
                    {showSiderChat && (
                        <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${!collapsed ? 'w-[290px] opacity-100' : 'w-0 opacity-0'}`}
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
                    <Content
                        className={cn(
                            'flex-1 p-[10px] bg-white rounded-xl relative overflow-hidden',
                            className
                        )}
                    >
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

export default ChatLayout
