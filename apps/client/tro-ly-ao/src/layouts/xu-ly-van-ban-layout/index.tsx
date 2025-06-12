import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import HeaderContent from '@components/layouts/header-content'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { Layout, theme } from 'antd'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'

const { Header, Content } = Layout

const XuLyVanBanLayout = ({
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
            <Layout className="h-screen">
                <Header className="fixed z-50 top-0 left-0 right-0 justify-between flex items-center bg-white shadow m-2 rounded-xl px-4">
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
                        <AvatarDropdown />
                    </div>
                </Header>

                <Layout className="mt-[70px] h-[calc(100vh-64px-20px)] p-[10px]">
                    <Layout className="">
                        <HeaderContent />
                        <Content className="h-full p-[10px] bg-white rounded-xl">
                            {children}
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default XuLyVanBanLayout
