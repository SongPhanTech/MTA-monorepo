import { HomeOutlined } from "@ant-design/icons"
import logo_mta from "@assets/images/khaothi.svg"
import SiderCreateLayout from "@components/layouts/sider"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { getDynamicBreadcrumb } from "@workspace/permissions/hooks"
import { Breadcrumb, Layout, theme } from "antd"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import HeaderApp from "@/components/header"

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
  const { status } = useSession()
  const currentPath = router.pathname
  const breadcrumb = getDynamicBreadcrumb("KHAO_THI", currentPath)
  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"
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
    if (typeof window !== "undefined") {
      const newValue = value ?? localStorage.getItem("collapsed") === "true"
      setCollapsed(newValue)
      localStorage.setItem("collapsed", newValue.toString())
    }
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    handleCollapsed()
  }, [])

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout style={{ minHeight: "100vh" }} hasSider>
        <div className="khao-thi-header-divider" aria-hidden />
        <SiderCreateLayout
          logo1={<Image src={logo_mta} alt="logo MTA" className="size-10" />}
          logo2={
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-10 mr-3" />
              <span className="text-xl font-bold color text-[#212121]">Quản lý hồ sơ</span>
            </div>
          }
          items={menus}
          onCollapse={handleCollapsed}
          collapsed={collapsed}
          theme={"light"}
        />
        <Layout
          style={{
            marginInlineStart: collapsed ? 80 : 230, // Điều chỉnh margin theo trạng thái collapsed
            transition: "margin-inline-start 0.2s", // Hiệu ứng mượt
          }}
        >
          <Header
            className={`flex h-16 justify-between items-center bg-[#f8fafc] fixed z-[1000] top-0  ${collapsed ? "w-[calc(100%-80px)] left-[80px]" : "w-[calc(100%-230px)] left-[230px]"}`}
          >
            {/* <span className="text-lg font-bold text-primary">
                            {headerChildren ? headerChildren : title}
                        </span> */}
            <Breadcrumb items={listBreadcrumb} />
            <HeaderApp />
          </Header>
          <Content className="khao-thi-layout-content mx-2">
            {unLayout ? (
              children
            ) : (
              <div
                className={cn("my-2", className)}
                style={{
                  background: "tranparent",
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
