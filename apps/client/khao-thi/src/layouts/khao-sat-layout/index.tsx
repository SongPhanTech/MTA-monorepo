import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { useMenuList } from '@hooks/menu-list'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { SearchSystem } from '@workspace/ui'
import { Layout, theme } from 'antd'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
const { Header, Content } = Layout

const KhaoSatLayout = ({
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
            <Layout style={{ minHeight: '100vh' }} hasSider>
                {/* <SiderDefaultLayout
                    logo1={
                        <Image
                            src={logo_mta}
                            alt="logo k01"
                            className="size-12"
                        />
                    }
                    logo2={
                        <div className="flex items-center justify-center flex-col text-center">
                            <Image
                                src={logo_mta}
                                alt="logo k01"
                                className="w-12 h-12 mb-2"
                            />
                            <span className="text-base font-bold color text-primary">
                                HỌC VIỆN KỸ THUẬT QUÂN SỰ
                            </span>
                        </div>
                    }
                    items={menus}
                    onCollapse={handleCollapsed}
                    collapsed={collapsed}
                    theme={'light'}
                /> */}
                <Layout
                    style={{
                        // marginInlineStart: collapsed ? 80 : 280, // Điều chỉnh margin theo trạng thái collapsed
                        transition: 'margin-inline-start 0.2s', // Hiệu ứng mượt
                    }}
                >
                    <Header className="flex justify-between items-center bg-white shadow-sm rounded-lg m-2">
                        <span className="text-lg font-bold text-primary">
                            KHẢO THÍ
                        </span>
                        <div className="flex gap-2 items-center">
                            <SearchSystem />
                            <AvatarDropdown />
                        </div>
                    </Header>
                    <Content className="mx-2">
                        <div
                            className={cn(
                                'min-h-[calc(100vh-64px-24px bg-primary rounded-lg shadow-sm',
                                className
                            )}
                            style={{
                                background: colorBgContainer,
                            }}
                        >
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default KhaoSatLayout
