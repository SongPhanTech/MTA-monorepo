import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'
import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import HeaderContent from '@components/layouts/header-content'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { CONFIG_KEY } from '@workspace/constant'
import {
    useDeleteConversation,
    useFindManyConversation,
    useFindUniqueConfig,
} from '@workspace/db/hooks'
import { Layout, message, theme } from 'antd'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'

const { Header, Content } = Layout

const ChatLayout = ({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) => {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(() => {
        return (
            typeof window !== 'undefined' &&
            localStorage.getItem('collapsed') === 'true'
        )
    })

    const { status, data: userInfo } = useSession()

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
            const newValue =
                value ?? localStorage.getItem('collapsed') === 'true'
            setCollapsed(newValue)
            localStorage.setItem('collapsed', newValue.toString())
        }
    }
    const { mutateAsync: deleteConversation } = useDeleteConversation()
    const handleDelete = async (id: string) => {
        if (!id) return
        const realId = id.split('-')[1]
        try {
            await deleteConversation({ where: { id: realId } })
            message.success('Đã xóa cuộc trò chuyện')
            router.push('/tro-ly-ao')
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        handleCollapsed()
    }, [])

    const { data: conversation } = useFindManyConversation({
        where: {
            // userId: userInfo?.user?.user_id || '',
            userId: 'cmbj92pfb01q8ny01np2o5gsd',
        },
        include: {
            message: true,
        },
    })
    const conversationMenuList: ConversationDataFromAPI = (
        conversation || []
    ).map((item) => ({
        id: item.id,
        label: item.message?.[0]?.content || 'Không có nội dung',
    }))

    return (
        <IdleTimerProvider
            timeout={
                Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000
            }
            onIdle={signOutAction}
        >
            <Layout className="h-screen">
                <Header className="fixed left-0 right-0 top-0 z-50 h-[64px] px-6 flex justify-between items-center bg-white border-b-2 border-primary shadow">
                    <div className="flex items-center gap-2">
                        <Image
                            src={logo_mta}
                            alt="logo_mta"
                            className="size-12"
                        />
                        <span className="text-lg font-bold text-primary">
                            HỌC VIỆN KỸ THUẬT QUÂN SỰ
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <AvatarDropdown />
                    </div>
                </Header>

                <Layout className="mt-[64px] h-[calc(100vh-64px-20px)] p-[10px]">
                    <SiderChatLayout
                        items={generateMenusTroLyAo(conversationMenuList)}
                        onCollapse={handleCollapsed}
                        collapsed={collapsed}
                        theme={'light'}
                        onDelete={handleDelete}
                    />
                    <Layout className="overflow-hidden">
                        <HeaderContent />
                        <Content className="h-full p-[10px] bg-white">
                            {children}
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default ChatLayout
