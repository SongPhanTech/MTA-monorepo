import logo_mta from "@assets/images/daotao.svg"
import GiangVienHeaderApp from "@components/header/giang-vien-header-app"
import SiderCongGiangVien from "@components/layouts/sider-cong-giang-vien"
import { CONG_GIANG_VIEN_MENU } from "@constants/cong-giang-vien-menu"
import {
  CONG_GIANG_VIEN_CONTENT_VERTICAL_OFFSET,
  CONG_GIANG_VIEN_DEFAULT_SCHOOL_NAME,
  CONG_GIANG_VIEN_HEADER_HEIGHT,
  CONG_GIANG_VIEN_PORTAL_TITLE,
  CONG_GIANG_VIEN_SIDEBAR_COLLAPSE_STORAGE_KEY,
  CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH,
  CONG_GIANG_VIEN_SIDER_WIDTH,
} from "@constants/cong-giang-vien-layout"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { useGetUnitInfosInfo } from "@workspace/libs/api/system"
import { Button, Layout } from "antd"
import { Menu as MenuIcon } from "lucide-react"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const { Header, Content } = Layout

const readSidebarCollapsed = () =>
  typeof window !== "undefined" &&
  localStorage.getItem(CONG_GIANG_VIEN_SIDEBAR_COLLAPSE_STORAGE_KEY) === "true"

const CongGiangVienLayout = ({
  children,
  className,
  unLayout = false,
}: {
  children: ReactNode
  className?: string
  unLayout?: boolean
}) => {
  const { data: unitInfoResponse } = useGetUnitInfosInfo()
  const unitInfo = unitInfoResponse?.data

  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)

  const handleCollapsed = (value?: boolean) => {
    if (typeof window === "undefined") return
    const newValue = value ?? !collapsed
    setCollapsed(newValue)
    localStorage.setItem(CONG_GIANG_VIEN_SIDEBAR_COLLAPSE_STORAGE_KEY, newValue.toString())
  }

  useEffect(() => {
    setCollapsed(readSidebarCollapsed())
  }, [])

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const siderWidth = collapsed ? CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH : CONG_GIANG_VIEN_SIDER_WIDTH
  const schoolName = unitInfo?.sTenDayDu || CONG_GIANG_VIEN_DEFAULT_SCHOOL_NAME

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout className="giang-vien-layout h-screen overflow-hidden bg-[#f3f4f6]">
        <Header className="giang-vien-header fixed top-0 left-0 right-0 z-[100] flex h-16 items-center justify-between border-none px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="text"
              aria-label="Thu gọn menu"
              className="giang-vien-header-menu-btn"
              icon={<MenuIcon size={22} />}
              onClick={() => handleCollapsed(!collapsed)}
            />
            <div className="giang-vien-header-logo">
              <Image src={logo_mta} alt="logo MTA" className="h-7 w-7" />
            </div>
            <div className="min-w-0 text-white leading-tight">
              <div className="truncate text-[11px] font-medium uppercase tracking-wide opacity-90">
                {schoolName}
              </div>
              <div className="truncate text-sm font-bold uppercase">
                {CONG_GIANG_VIEN_PORTAL_TITLE}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <GiangVienHeaderApp className="giang-vien-header-app" />
          </div>
        </Header>

        <Layout hasSider style={{ marginTop: CONG_GIANG_VIEN_HEADER_HEIGHT }}>
          <SiderCongGiangVien items={CONG_GIANG_VIEN_MENU} collapsed={collapsed} />
          <Layout
            style={{
              marginInlineStart: siderWidth,
              transition: "margin-inline-start 0.2s",
              height: `calc(100vh - ${CONG_GIANG_VIEN_HEADER_HEIGHT}px)`,
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
                    minHeight: `calc(100vh - ${CONG_GIANG_VIEN_CONTENT_VERTICAL_OFFSET}px)`,
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

export default CongGiangVienLayout
