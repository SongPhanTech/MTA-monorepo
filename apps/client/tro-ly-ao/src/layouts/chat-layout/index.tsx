import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'
import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import HeaderContent from '@components/layouts/header-content'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { Layout, theme } from 'antd'
import Image from 'next/image'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import { signIn, useSession } from 'next-auth/react'

const { Header, Content } = Layout

const ChatLayout = ({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) => {
    const [collapsed, setCollapsed] = useState(() => {
        return (
            typeof window !== 'undefined' &&
            localStorage.getItem('collapsed') === 'true'
        )
    })

    const { status } = useSession()

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

    // Load collapsed state on mount
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        handleCollapsed()
    }, [])

    // Auto sign in if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn('asgardeo')
        }
    }, [status])

    const mockData: ConversationDataFromAPI = [
        { id: '1', label: 'Create HTML Game Environment' },
        { id: '2', label: 'Apply to Leave for Emergency' },
        { id: '3', label: 'What is UI UX Design?' },
        { id: '4', label: 'Create POS System' },
        { id: '5', label: 'Develop E-commerce Website' },
    ]

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
                        <Image src={logo_mta} alt="logo_mta" className="size-12" />
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
                        items={generateMenusTroLyAo(mockData)}
                        onCollapse={handleCollapsed}
                        collapsed={collapsed}
                        theme={'light'}
                    />
                    <Layout className="overflow-hidden">
                        <HeaderContent />
                        <Content className="h-full overflow-y-auto p-[10px] bg-white">
                            {children}
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default ChatLayout