import { ConversationDataFromAPI, generateMenusTroLyAo } from '@/navigations/sider-tro-ly-ao'
import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import SiderDefaultLayout from '@components/layouts/sider'
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
}: { children: ReactNode; className?: string }) => {
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
        { id: '3' }, // sẽ auto thành "Hội thoại số 3"
    ]
    
    return (
        <IdleTimerProvider
            timeout={
                Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000
            }
            onIdle={signOutAction}
        >
            <Layout style={{ minHeight: '100vh' }} hasSider>
                <SiderDefaultLayout
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
                    items={generateMenusTroLyAo(mockData)}
                    onCollapse={handleCollapsed}
                    collapsed={collapsed}
                    theme={'light'}
                />
                <Layout
                    style={{
                        marginInlineStart: collapsed ? 80 : 280, // Điều chỉnh margin theo trạng thái collapsed
                        transition: 'margin-inline-start 0.2s', // Hiệu ứng mượt
                    }}
                >
                    {/* <Header className="pl-6 justify-between flex items-center pr-6 bg-white border-2 border-b-primary shadow m-4 rounded">
                        <span className="text-lg font-bold text-primary">
                            TRỢ LÝ ẢO
                        </span>
                        <div className="flex gap-2 items-center">
                            <AvatarDropdown />
                        </div>
                    </Header> */}
                    <Content className="flex flex-col gap-2 m-4 mt-1">
                        <div
                            style={{
                                background: colorBgContainer,
                            }}
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
        </IdleTimerProvider>
    )
}

export default ChatLayout
