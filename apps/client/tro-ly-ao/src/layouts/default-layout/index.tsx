import { HomeOutlined } from '@ant-design/icons'
import logo_mta from '@assets/images/logo_mta.png'
import SiderDefaultLayout from '@components/layouts/sider'
import { useMenuList } from '@hooks/menu-list'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { getDynamicBreadcrumb } from '@workspace/permissions/hooks'
import { WidgetChatbot } from '@workspace/ui'
import { Breadcrumb, Layout, Spin, theme } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import HeaderApp from '@/components/header'
import { useSSOSession } from '@/hooks/useSSOSession'

const { Header, Content } = Layout
interface breadcrumListProps {
    title: string
    href?: string
}

/**
 * DefaultLayout - Layout cho trang quản trị (/quan-tri/*)
 * YÊU CẦU ĐĂNG NHẬP SSO
 * Nếu chưa đăng nhập sẽ redirect về trang SSO
 */
const DefaultLayout = ({
    children,
    className,
    breadcrumbList,
    unLayout = false,
}: {
    children: ReactNode
    className?: string
    breadcrumbList?: breadcrumListProps[]
    unLayout?: boolean
}) => {
    const menus = useMenuList()
    const router = useRouter()
    const currentPath = router.pathname
    const breadcrumb = getDynamicBreadcrumb('TRO_LY_AO', currentPath)
    const [collapsed, setCollapsed] = useState(() => {
        return typeof window !== 'undefined' && localStorage.getItem('collapsed') === 'true'
    })

    // SSO Authentication check - sử dụng hook riêng
    const { status, signIn, refetch } = useSSOSession()

    // Ref để đảm bảo chỉ redirect 1 lần
    const hasRedirected = useRef(false)

    // Force fresh session check on admin page mount to avoid stale cache
    // preventing premature rendering that triggers mta-session-expired dialog
    const hasStartedVerify = useRef(false)
    const [sessionVerified, setSessionVerified] = useState(false)

    // All hooks must be called before any early return
    const listBreadcrumb = useMemo(() => {
        return breadcrumb?.length > 0
            ? [
                  {
                      title: (
                          <Link href="/tro-ly-ao">
                              <HomeOutlined className="mr-1" />
                              Trang chủ
                          </Link>
                      ),
                  },
                  ...breadcrumb.map((i: { title: string; href?: string }) => {
                      if (i?.href) {
                          return {
                              title: <Link href={i.href}>{i.title}</Link>,
                          }
                      }
                      return {
                          title: i.title,
                      }
                  }),
              ]
            : breadcrumbList
              ? [
                    {
                        title: (
                            <Link href="/tro-ly-ao">
                                <HomeOutlined className="mr-1" />
                                Trang chủ
                            </Link>
                        ),
                    },
                    ...breadcrumbList.map((i: { title: string; href?: string }) => {
                        if (i?.href) {
                            return {
                                title: <Link href={i.href}>{i.title}</Link>,
                            }
                        }
                        return {
                            title: i.title,
                        }
                    }),
                ]
              : [
                    {
                        title: (
                            <Link href="/tro-ly-ao">
                                <HomeOutlined className="mr-1" />
                                Trang chủ
                            </Link>
                        ),
                    },
                ]
    }, [breadcrumb, breadcrumbList])

    const isAuthenticated = sessionVerified && status === 'authenticated'

    const { data: userSessionTimeout } = useFindUniqueConfig({
        where: {
            key: CONFIG_KEY.USER_SESSION_TIMEOUT,
        },
    }, { enabled: isAuthenticated })

    const {
        token: { colorBgContainer },
    } = theme.useToken()

    const handleCollapsed = (value?: boolean) => {
        if (typeof window !== 'undefined') {
            const newValue = value ?? localStorage.getItem('collapsed') === 'true'
            setCollapsed(newValue)
            localStorage.setItem('collapsed', newValue.toString())
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        handleCollapsed()
    }, [])

    // Force fresh session verification on admin page mount
    // This prevents stale cache from causing premature rendering
    // which triggers UMD API calls → 401 → mta-session-expired dialog
    useEffect(() => {
        if (!hasStartedVerify.current) {
            hasStartedVerify.current = true
            refetch()
        }
    }, [refetch])

    // Track when fresh verification completes
    useEffect(() => {
        if (hasStartedVerify.current && status !== 'loading') {
            setSessionVerified(true)
        }
    }, [status])

    // Redirect to SSO if not authenticated
    // Chỉ redirect 1 lần duy nhất
    useEffect(() => {
        if (sessionVerified && status === 'unauthenticated' && !hasRedirected.current) {
            hasRedirected.current = true
            signIn()
        }
    }, [sessionVerified, status, signIn])

    // Show loading while verifying session
    if (!sessionVerified || status === 'loading') {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
                </div>
            </div>
        )
    }

    // Nếu unauthenticated, hiển thị loading (đang redirect)
    if (status === 'unauthenticated') {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
                </div>
            </div>
        )
    }

    return (
        <IdleTimerProvider
            timeout={Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000}
            onIdle={() => {}}
        >
            <Layout style={{ minHeight: '100vh' }} hasSider>
                <SiderDefaultLayout
                    logo1={<Image src={logo_mta} alt="logo tro-ly-ao" className="size-10" />}
                    logo2={
                        <div className="flex items-center justify-center text-center">
                            <Image src={logo_mta} alt="logo tro-ly-ao" className="w-10 h-10 mr-3" />
                            <span className="text-base font-bold color text-primary">
                                Trợ lý ảo
                            </span>
                        </div>
                    }
                    items={menus}
                    onCollapse={handleCollapsed}
                    collapsed={collapsed}
                    theme={'light'}
                />
                <Layout
                    style={{
                        marginInlineStart: collapsed ? 80 : 230, // Điều chỉnh margin theo trạng thái collapsed
                        transition: 'margin-inline-start 0.2s', // Hiệu ứng mượt
                    }}
                >
                    <Header
                        className={`flex justify-between items-center bg-white shadow-sm mb-2 fixed z-[1000] top-0  ${collapsed ? 'w-[calc(100%-80px)] left-[80px]' : 'w-[calc(100%-230px)] left-[230px]'}`}
                    >
                        <div className="flex items-center">
                            <Breadcrumb items={listBreadcrumb} />
                        </div>
                        <HeaderApp />
                    </Header>
                    <Content className="mx-2 mt-20">
                        {unLayout ? (
                            children
                        ) : (
                            <div
                                className={cn(
                                    'min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4',
                                    className
                                )}
                                style={{
                                    background: colorBgContainer,
                                }}
                            >
                                <WidgetChatbot />
                                {children}
                            </div>
                        )}
                    </Content>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default DefaultLayout
