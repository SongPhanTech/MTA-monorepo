import logo_mta from '@assets/images/logo_mta.png'
import AvatarDropdown from '@components/layouts/avatar-dropdown'
import SiderDefaultLayout from '@components/layouts/sider'
import { navigations } from '@navigations/sider'
import { Layout, theme } from 'antd'
import Image from 'next/image'
import { useEffect, useState } from 'react'
const { Header, Content } = Layout

const DefaultLayout: any = ({ children }: any) => {
    const [collapsed, setCollapsed] = useState(() => {
        return (
            typeof window !== 'undefined' &&
            localStorage.getItem('collapsed') === 'true'
        )
    })
    const {
        token: { colorBgContainer },
    } = theme.useToken()

    // const headerTitle = useLayoutTitle()

    const handleCollapsed = (value?: boolean) => {
        if (typeof window !== 'undefined') {
            const newValue =
                value ?? localStorage.getItem('collapsed') === 'true'
            setCollapsed(newValue)
            localStorage.setItem('collapsed', newValue.toString())
        }
    }

    useEffect(() => {
        handleCollapsed()
    }, [])

    return (
        <Layout style={{ minHeight: '100vh' }} hasSider>
            <SiderDefaultLayout
                logo1={
                    <Image src={logo_mta} alt="logo k01" className="size-12" />
                }
                logo2={
                    <div className="flex items-center justify-center flex-col text-center">
                        <Image
                            src={logo_mta}
                            alt="logo k01"
                            className="w-12 h-12 mb-2"
                        />
                        <span className="text-base font-bold color text-white">
                            HỌC VIỆN KỸ THUẬT QUÂN SỰ
                        </span>
                    </div>
                }
                items={navigations}
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
                <Header className="pl-6 justify-between flex items-center pr-6 bg-white border-2 border-b-primary shadow m-4 rounded">
                    <span className="text-lg font-bold text-primary">
                        PHÂN HỆ QUẢN LÝ ĐÀO TẠO
                    </span>
                    <AvatarDropdown />
                </Header>
                <Content className="flex flex-col gap-2 m-4 mt-1">
                    <div
                        style={{
                            background: colorBgContainer,
                        }}
                        className="min-h-[100vh] rounded shadow p-6 pt-2"
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default DefaultLayout
