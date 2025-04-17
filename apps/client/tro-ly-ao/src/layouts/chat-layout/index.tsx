import type { ConversationDataFromAPI } from '@/navigations/sider-tro-ly-ao'
import { generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'
import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import SiderChatLayout from '@components/layouts/sider/chat-sider'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { Layout, theme } from 'antd'
import Image from 'next/image'
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
    const [collapsed, setCollapsed] = useState(() => {
        return (
            typeof window !== 'undefined' &&
            localStorage.getItem('collapsed') === 'true'
        )
    })

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
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        handleCollapsed()
    }, [])

    const mockData: ConversationDataFromAPI = [
        { id: '1', label: 'Chat với khách A' },
        { id: '2', label: 'Chat nội bộ' },
        { id: '3' },
    ]

    return (
        <IdleTimerProvider
            timeout={
                Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000
            }
            onIdle={signOutAction}
        >
            <Layout style={{ minHeight: '100vh' }}>
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

                <Layout hasSider style={{ paddingTop: 64 }}>
                    {/* Sider */}
                    <SiderChatLayout
                        items={generateMenusTroLyAo(mockData)}
                        onCollapse={handleCollapsed}
                        collapsed={collapsed}
                        theme={'light'}
                    />

                    {/* Content */}
                    <Layout
                        style={{
                            marginInlineStart: collapsed ? 80 : 280,
                            transition: 'margin-inline-start 0.2s',
                        }}
                    >
                        <Content className="flex flex-col gap-2 mt-[11px] mx-2">
                            <div
                                style={{ background: colorBgContainer }}
                                className={cn(
                                    'min-h-[100vh] rounded shadow p-4',
                                    className
                                )}
                            >
                                {children}
                            </div>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default ChatLayout
