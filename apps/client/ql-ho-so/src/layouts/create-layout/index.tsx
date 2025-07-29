import { HomeOutlined } from '@ant-design/icons'
import logo_mta from '@assets/images/hoso.svg'
import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import SiderCreateLayout from '@components/layouts/sider'
import { useMenuList } from '@hooks/menu-list'
import { getDynamicBreadcrum } from '@lib/casl/hooks'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig } from '@workspace/db/hooks'
import { Breadcrumb, Layout, theme } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import HeaderApp from '@/components/header'

const { Header, Content } = Layout
interface breadcrumListProps {
    title: string
    href?: string
}

const CreateLayout = ({
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
    const router = useRouter()
    const currentPath = router.pathname
    const breadcrumb = getDynamicBreadcrum('QL_HO_SO', currentPath)
    const [collapsed, setCollapsed] = useState(() => {
        return typeof window !== 'undefined' && localStorage.getItem('collapsed') === 'true'
    })

    const listBreadcrumb = useMemo(() => {
        return breadcrumb?.length > 0
            ? [
                  {
                      title: (
                          <Link href="/home">
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
                            <Link href="/home">
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
                            <Link href="/home">
                                <HomeOutlined className="mr-1" />
                                Trang chủ
                            </Link>
                        ),
                    },
                ]
    }, [breadcrumb, breadcrumbList])
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
            const newValue = value ?? localStorage.getItem('collapsed') === 'true'
            setCollapsed(newValue)
            localStorage.setItem('collapsed', newValue.toString())
        }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        handleCollapsed()
    }, [])

    return (
        <IdleTimerProvider
            timeout={Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000}
            onIdle={signOutAction}
        >
            <Layout style={{ minHeight: '100vh' }} hasSider>
                <SiderCreateLayout
                    logo1={<Image src={logo_mta} alt="logo k01" className="size-10" />}
                    logo2={
                        <div className="flex items-center justify-center text-center">
                            <Image src={logo_mta} alt="logo k01" className="w-10 h-10 mr-3" />
                            <span className="text-xl font-bold color text-[#212121]">
                                Quản lý hồ sơ
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
                    <Header className="flex justify-between items-center bg-white shadow-sm mb-2 w-full fixed z-[1000]">
                        {/* <span className="text-lg font-bold text-primary">
                            {headerChildren ? headerChildren : title}
                        </span> */}
                        <div>{<Breadcrumb items={listBreadcrumb} />}</div>
                        <HeaderApp />

                        {/* <div className="flex gap-2 items-center">
                            <SearchSystem />
                            <AvatarDropdown />
                        </div> */}
                    </Header>
                    <Content className="mx-2 mt-20">
                        {unLayout ? (
                            children
                        ) : (
                            <div
                                className={cn('my-2', className)}
                                style={{
                                    background: 'tranparent',
                                }}
                            >
                                {children}
                            </div>
                        )}
                    </Content>
                </Layout>
            </Layout>
        </IdleTimerProvider>
    )
}

export default CreateLayout
