import logo_mta from '@assets/images/logo_mta.png'
import AppSwitcherFloatButton from '@components/commons/app-switcher-modal'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { cn } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import {
    useDeleteConversation,
    useDeleteManyMessage,
    useFindManyConversation,
} from '@workspace/db/hooks'
import { Layout, message, Spin } from 'antd'
import Image from 'next/image'
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
        <>
            {/* Header */}
            <Header className="fixed z-50 top-0 left-0 right-0 flex justify-between items-center bg-white shadow rounded-xl px-4 py-2 m-2 h-[64px]">
                <div className="flex items-center gap-3">
                    <Image src={logo_mta} alt="logo_mta" className="w-10 h-10" />
                    <span className="text-lg font-bold text-primary">
                        HỌC VIỆN KỸ THUẬT QUÂN SỰ
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <AvatarDropdown />
                </div>
            </Header>

            {/* Layout bên dưới header */}
            <Layout className="h-screen pt-[80px] p-[10px]">
                {showSiderChat && (
                    <SiderChatLayout
                        items={generateMenusTroLyAo(conversationMenuList)}
                        onCollapse={handleCollapsed}
                        collapsed={collapsed}
                        theme={'light'}
                        onDelete={handleDelete}
                    />
                )}
                <Layout className="overflow-hidden flex flex-col">
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
            <AppSwitcherFloatButton />
        </>
    )
}

export default ChatLayout
