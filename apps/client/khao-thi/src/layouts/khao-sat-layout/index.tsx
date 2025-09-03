import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { cn } from '@lib/utils'

import { Layout } from 'antd'
import type { ReactNode } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'

const { Header, Content } = Layout

const KhaoSatLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <IdleTimerProvider timeout={Number.parseFloat('15') * 60 * 1000} onIdle={signOutAction}>
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
                        <span className="text-lg font-bold text-primary">KHẢO THÍ</span>
                        <div className="flex gap-2 items-center"></div>
                    </Header>
                    <Content className="mx-2">
                        <div
                            className={cn(
                                'min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm',
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

export default KhaoSatLayout
