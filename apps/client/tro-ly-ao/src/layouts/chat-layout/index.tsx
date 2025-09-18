import ChatHeader from '@components/layouts/header/chat-header'
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
    const [collapsed, setCollapsed] = useState(() => {
        return typeof window !== 'undefined' && localStorage.getItem('collapsed') === 'true'
    })

    const { data: userCurrent } = useSession()

    const handleCollapsed = (value?: boolean) => {
        if (typeof window !== 'undefined') {
            const newValue = value ?? localStorage.getItem('collapsed') === 'true'
            setCollapsed(newValue)
            localStorage.setItem('collapsed', newValue.toString())
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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        handleCollapsed()
    }, [])

    const { data: conversation } = useFindManyConversation({
        where: {
            // userId: userCurrent?.sDM_NhanVienId || '',
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
        <Layout className="h-screen p-[10px]">
            <Layout className="overflow-hidden flex flex-col">
                <ChatHeader collapsed={collapsed} onCollapse={handleCollapsed} />
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
