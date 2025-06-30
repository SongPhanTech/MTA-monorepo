import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import HeaderContent from '@components/layouts/header-content'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { useSession } from '@workspace/auth/react'
import { CONFIG_KEY } from '@workspace/constant'
import {
    useDeleteConversation,
    useDeleteManyMessage,
    useFindManyConversation,
    useFindUniqueConfig,
} from '@workspace/db/hooks'
import { Layout, message, Spin, theme } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'

const { Header, Content } = Layout

const ChatLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        return typeof window !== 'undefined' && localStorage.getItem('collapsed') === 'true'
    })

    const { data: userCurrent } = useSession()

    const { data: userSessionTimeout } = useFindUniqueConfig({
        where: {
            key: CONFIG_KEY.USER_SESSION_TIMEOUT,
        },
    })

    const {
        token: { colorBgContainer },
    } = theme.useToken()

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
            userId: userCurrent?.sDM_NhanVienId || '',
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
        <IdleTimerProvider
            timeout={Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000}
            onIdle={signOutAction}
        >
            <Layout className="h-screen">
                <Header className="fixed z-50 top-0 left-0 right-0 justify-between flex items-center bg-white shadow m-2 rounded-xl px-4">
                    <div className="flex items-center gap-4">
                        <Image src={logo_mta} alt="logo_mta" className="w-10 h-10" />
                        <span className="text-lg font-bold text-primary">
                            HỌC VIỆN KỸ THUẬT QUÂN SỰ
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <AvatarDropdown />
                    </div>
                </Header>

                <Layout className="mt-[70px] h-[calc(100vh-64px-20px)] p-[10px]">
                    <SiderChatLayout
                        items={generateMenusTroLyAo(conversationMenuList)}
                        onCollapse={handleCollapsed}
                        collapsed={collapsed}
                        theme={'light'}
                        onDelete={handleDelete}
                    />
                    <Layout className="overflow-hidden">
                        <HeaderContent />
                        {/* <Content className="h-full p-[10px] bg-white rounded-lg">
                            {children}
                        </Content> */}
                        <Content className="h-full p-[10px] bg-white rounded-xl relative overflow-hidden">
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
        </IdleTimerProvider>
    )
}

export default ChatLayout
