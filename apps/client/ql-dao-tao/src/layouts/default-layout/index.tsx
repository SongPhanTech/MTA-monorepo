import { HomeOutlined } from '@ant-design/icons'
import logo_mta from '@assets/images/daotao.svg'
import SiderDefaultLayout from '@components/layouts/sider'
import { useMenuList } from '@hooks/menu-list'
import { cn } from '@lib/utils'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindManyTrainingObjectType, useFindUniqueConfig } from '@workspace/db/hooks'
import { getDynamicBreadcrumb } from '@workspace/permissions/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { SelectTrainingObjectType } from '@workspace/ui'
import { Breadcrumb, Divider, Layout, theme } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import HeaderApp from '@/components/header'

const { Header, Content } = Layout
interface BreadcrumbListProps {
    title: string
    href?: string
}

const DefaultLayout = ({
    children,
    className,
    breadcrumbList,
    unLayout = false,
}: {
    children: ReactNode
    className?: string
    breadcrumbList?: BreadcrumbListProps[]
    unLayout?: boolean
}) => {
    const router = useRouter()
    const currentPath = router.pathname
    const breadcrumb = getDynamicBreadcrumb('QL_DAO_TAO', currentPath)
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
                            <Link href={ROUTER_PATH.QL_DAO_TAO.HOME}>
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
    const { data: doiTuongDaoTao = [] } = useFindManyTrainingObjectType({
        orderBy: {
            name: 'asc',
        },
    })
    return (
        <IdleTimerProvider
            timeout={Number.parseFloat(userSessionTimeout?.value || '15') * 60 * 1000}
            onIdle={() => {}}
        >
            <Layout style={{ minHeight: '100vh' }} hasSider>
                <SiderDefaultLayout
                    logo1={<Image src={logo_mta} alt="logo k01" className="size-10" />}
                    logo2={
                        <div className="flex items-center justify-center text-center">
                            <Image src={logo_mta} alt="logo k01" className="w-10 h-10 mr-3" />
                            <span className="text-base font-bold color text-primary">
                                Quản lý đào tạo
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
                        {/* <span className="text-lg font-bold text-primary">
                            {headerChildren ? headerChildren : title}
                        </span> */}

                        <div className="flex items-center">
                            <SelectTrainingObjectType />
                            <Divider type="vertical" className="bg-primary h-[30px]" />
                            <Breadcrumb items={listBreadcrumb} />
                        </div>
                        <HeaderApp />
                    </Header>
                    <Content className="mx-2 mt-[70px]">
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
