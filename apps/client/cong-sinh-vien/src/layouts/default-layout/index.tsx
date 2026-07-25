import logo_mta from "@assets/images/daotao.svg"
import SiderDefaultLayout from "@components/layouts/sider"
import HeaderApp from "@/components/header"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { Button, Layout } from "antd"
import { Menu as MenuIcon } from "lucide-react"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const { Header, Content } = Layout

const SIDER_WIDTH = 250
const SIDER_COLLAPSED_WIDTH = 80
const HEADER_HEIGHT = 64
const CONTENT_VERTICAL_OFFSET = HEADER_HEIGHT + 32
const PORTAL_TITLE = "Cổng sinh viên"

const readSidebarCollapsed = () =>
  typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"

interface BreadcrumbItem {
  title: ReactNode
  href?: string
}

const DefaultLayout = ({
  children,
  className,
  unLayout = false,
}: {
  children: ReactNode
  className?: string
  breadcrumbList?: BreadcrumbItem[]
  unLayout?: boolean
}) => {
  const menus = useMenuList()

  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)

  const handleCollapsed = (value?: boolean) => {
    if (typeof window === "undefined") return
    const newValue = value ?? !collapsed
    setCollapsed(newValue)
    localStorage.setItem("collapsed", newValue.toString())
  }

  useEffect(() => {
    setCollapsed(readSidebarCollapsed())
  }, [])

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const siderWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout className="sinh-vien-layout h-screen overflow-hidden bg-[#f3f4f6]">
        <Header className="sinh-vien-header fixed top-0 left-0 right-0 z-[100] flex h-16 items-center justify-between border-none px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="text"
              aria-label="Thu gọn menu"
              className="sinh-vien-header-menu-btn"
              icon={<MenuIcon size={22} />}
              onClick={() => handleCollapsed(!collapsed)}
            />
            <div className="sinh-vien-header-logo">
              <Image src={logo_mta} alt="logo MTA" className="h-7 w-7" />
            </div>
            <div className="min-w-0 text-white leading-tight">
              <div className="truncate text-sm font-bold uppercase">{PORTAL_TITLE}</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <HeaderApp className="sinh-vien-header-app" />
          </div>
        </Header>

        <Layout hasSider style={{ marginTop: HEADER_HEIGHT }}>
          <SiderDefaultLayout items={menus} collapsed={collapsed} />
          <Layout
            style={{
              marginInlineStart: siderWidth,
              transition: "margin-inline-start 0.2s",
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              overflow: "hidden",
            }}
          >
            <Content className="flex h-full flex-col overflow-y-auto px-2 py-2">
              {unLayout ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
              ) : (
                <div
                  className={cn("rounded-lg bg-white p-4 shadow-sm", className)}
                  style={{
                    minHeight: `calc(100vh - ${CONTENT_VERTICAL_OFFSET}px)`,
                  }}
                >
                  {children}
                </div>
              )}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </IdleTimerProvider>
  )
}

export default DefaultLayout
