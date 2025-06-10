import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import SiderDefaultLayout from '@components/layouts/sider'
import { useMenuList } from '@hooks/menu-list'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { SearchSystem } from '@workspace/ui'
import { Layout, theme } from 'antd'
import Image from 'next/image'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
const { Header, Content } = Layout

const DefaultLayout = ({
    children,
    className,
}: { children: ReactNode; className?: string }) => {
    const [collapsed, setCollapsed] = useState(() => {
        return (
            typeof window !== 'undefined' &&
            localStorage.getItem('collapsed') === 'true'
        )
    })

    const menus = useMenuList()

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

    return (
        <IdleTimerProvider
            timeout={
                Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000
            }
            onIdle={signOutAction}
        >
            <Layout className="h-[100px]">
                <Header className="fixed z-50 top-0 left-0 right-0 justify-between flex items-center bg-white shadow m-4 rounded-xl px-4">
                    <div className="flex items-center gap-4">
                        <Image
                            src={logo_mta}
                            alt="logo_mta"
                            className="w-10 h-10"
                        />
                        <span className="text-lg font-bold text-primary">
                            HỌC VIỆN KỸ THUẬT QUÂN SỰ
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <SearchSystem />
                        <AvatarDropdown />
                    </div>
                </Header>
            </Layout>
            <Layout hasSider>
                <SiderDefaultLayout
                    items={menus}
                    onCollapse={handleCollapsed}
                    collapsed={collapsed}
                    theme={'light'}
                />
                <Layout
                    style={{
                        marginInlineStart: collapsed ? 80 + 16 : 280 + 16, // Điều chỉnh margin theo trạng thái collapsed
                        transition: 'margin-inline-start 0.2s', // Hiệu ứng mượt
                    }}
                >
                    <div
                        className={cn(
                            'min-h-[100vh] rounded p-4 pb-2 pt-0',
                            className
                        )}
                    >
                        {children}
                    </div>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default DefaultLayout
