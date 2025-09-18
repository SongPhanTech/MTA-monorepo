import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import SiderDefaultLayout from '@components/layouts/sider'
import { useMenuList } from '@hooks/menu-list'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { SearchSystem, WidgetChatbot } from '@workspace/ui'
import { Layout, theme } from 'antd'
import Image from 'next/image'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'

const { Header, Content } = Layout

const DefaultLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
    const [collapsed, setCollapsed] = useState(false)

    const menus = useMenuList()

    const { data: userSessionTimeout } = useFindUniqueConfig({
        where: {
            key: CONFIG_KEY.USER_SESSION_TIMEOUT,
        },
    })

    const {
        token: { colorBgContainer },
    } = theme.useToken()

    const handleCollapsed = (newCollapsed: boolean) => {
        setCollapsed(newCollapsed)
        if (typeof window !== 'undefined') {
            localStorage.setItem('collapsed', newCollapsed.toString())
        }
    }

    // Initialize from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('collapsed')
            if (savedState !== null) {
                setCollapsed(savedState === 'true')
            }
        }
    }, [])

    return (
        <IdleTimerProvider
            timeout={Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000}
            onIdle={signOutAction}
        >
            {/* Header */}
            <Header className="fixed z-50 top-0 left-0 right-0 flex justify-between items-center bg-white shadow rounded-xl px-4 py-2 m-2 h-[64px]">
                <div className="flex items-center gap-3">
                    <Image src={logo_mta} alt="logo_mta" className="w-10 h-10" />
                    <span className="text-lg font-bold text-primary">
                        HỌC VIỆN KỸ THUẬT QUÂN SỰ
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <SearchSystem />
                    <AvatarDropdown />
                </div>
            </Header>

            {/* Layout bên dưới header */}
            <Layout hasSider className="pt-[80px]">
                <SiderDefaultLayout
                    items={menus}
                    onCollapse={handleCollapsed}
                    collapsed={collapsed}
                    theme="light"
                />
                <Layout
                    style={{
                        marginInlineStart: collapsed ? 96 : 296,
                        transition: 'margin-inline-start 0.2s',
                    }}
                >
                    <Content
                        className={cn('p-4 rounded-lg', className)}
                        style={{
                            height: 'calc(100vh - 80px)',
                            overflowY: 'auto',
                            background: colorBgContainer,
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
            <WidgetChatbot />
        </IdleTimerProvider>
    )
}

export default DefaultLayout
