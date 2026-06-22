import logo_mta from "@assets/images/khaothi.svg"
import HeaderApp from "@components/header"
import SiderDefaultLayout from "@components/layouts/sider"
import { useMenuList } from "@hooks/menu-list"
import { useSession } from "@workspace/auth/react"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { Layout, theme } from "antd"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const { Header, Content } = Layout

const DashboardLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
  const menus = useMenuList()
  const { status } = useSession()
  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"
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
      <Layout style={{ minHeight: "100vh" }} hasSider className="bg-blue-50">
        <div className="khao-thi-header-divider" aria-hidden />
        <SiderDefaultLayout
          logo1={<Image src={logo_mta} alt="logo MTA" className="size-10" />}
          logo2={
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-10 mr-3" />
              <span className="text-xl font-bold color text-primary">Quản lý khảo thí</span>
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
            className={`flex h-16 justify-end items-center bg-[#f8fafc] fixed z-[1000] top-0  ${collapsed ? "w-[calc(100%-80px)] left-[80px]" : "w-[calc(100%-230px)] left-[230px]"}`}
          >
            <HeaderApp />
          </Header>
          <Content className="khao-thi-layout-content mx-2">
            {/* <div
                            className={cn(
                                'min-h-[calc(100vh-64px-24px)] rounded-lg',
                                className
                            )}
                        > */}
            {children}
            {/* </div> */}
          </Content>
        </Layout>
      </Layout>
    </IdleTimerProvider>
  )
}

export default DashboardLayout
