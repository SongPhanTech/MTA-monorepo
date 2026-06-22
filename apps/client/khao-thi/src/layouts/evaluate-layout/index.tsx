import logo_mta from "@assets/images/khaothi.svg"
import SiderDefaultLayout from "@components/layouts/sider"
import { SelecterSchoolYear } from "@components/selecter-school-year"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { Layout, Tooltip, theme } from "antd"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import HeaderApp from "@/components/header"
import { Footer } from "antd/es/layout/layout"
import packageInfo from "../../../package.json"

const { Header, Content } = Layout

const EvaluateLayout = ({
  children,
  className,
  unLayout = false,
}: {
  children: ReactNode
  className?: string
  unLayout?: boolean
}) => {
  const menus = useMenuList()
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
      <Layout style={{ minHeight: "100vh" }} hasSider>
        <div className="khao-thi-header-divider" aria-hidden />
        <SiderDefaultLayout
          logo1={<Image src={logo_mta} alt="logo MTA" className="size-10" />}
          logo2={
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-10 mr-3" />
              <span className="text-base font-bold color text-primary">Quản lý khảo thí</span>
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
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Tooltip title="Năm học">
                  <div className="mr-2 font-bold">Năm học</div>
                </Tooltip>
                <SelecterSchoolYear />
              </div>
            </div>
            <HeaderApp />
          </Header>
          <Content className="khao-thi-layout-content">
            {unLayout ? (
              children
            ) : (
              <div
                className={cn("min-h-[calc(100vh-64px)] bg-white shadow-sm px-4", className)}
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
      <Footer className="fixed bottom-0 w-full z-[1000] flex items-center p-2">
        <div>Học viện Kỹ thuật Quân sự - Địa chỉ: Số 236, Hoàng Quốc Việt, Cầu Giấy, Hà Nội</div>
        <div className="ml-auto">Phiên bản: {packageInfo.version}</div>
      </Footer>
    </IdleTimerProvider>
  )
}

export default EvaluateLayout
