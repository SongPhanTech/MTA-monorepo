import logo_mta from "@assets/images/daotao.svg"
import GiangVienHeaderApp from "@components/header/giang-vien-header-app"
import SiderCongGiangVien, {
  CONG_GIANG_VIEN_HEADER_HEIGHT,
  CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH,
  CONG_GIANG_VIEN_SIDER_WIDTH,
} from "@components/layouts/sider-cong-giang-vien"
import ToggleVaiTroCongGiangVien from "@components/layouts/toggle-vai-tro-cong-giang-vien"
import { CONG_GIANG_VIEN_MENU } from "@constants/cong-giang-vien-menu"
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

  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"
  })

  const handleCollapsed = (value?: boolean) => {
    if (typeof window !== "undefined") {
      const newValue = value ?? !collapsed
      setCollapsed(newValue)
      localStorage.setItem("collapsed", newValue.toString())
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(localStorage.getItem("collapsed") === "true")
    }
  }, [])

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const siderWidth = collapsed ? CONG_GIANG_VIEN_SIDER_COLLAPSED_WIDTH : CONG_GIANG_VIEN_SIDER_WIDTH
  const schoolName = unitInfo?.sTenDayDu || "Học viện Kỹ thuật Quân sự"

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout className="giang-vien-layout min-h-screen bg-[#f3f4f6]">
        <Header className="giang-vien-header fixed top-0 left-0 right-0 z-[1001] flex h-16 items-center justify-between border-none px-4">
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
              <div className="truncate text-sm font-bold uppercase">Cổng giảng viên</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <ToggleVaiTroCongGiangVien />
            <GiangVienHeaderApp className="giang-vien-header-app" />
          </div>
        </Header>

        <Layout hasSider style={{ marginTop: CONG_GIANG_VIEN_HEADER_HEIGHT }}>
          <SiderCongGiangVien
            items={CONG_GIANG_VIEN_MENU}
            onCollapse={handleCollapsed}
            collapsed={collapsed}
          />
          <Layout
            style={{
              marginInlineStart: siderWidth,
              transition: "margin-inline-start 0.2s",
              minHeight: `calc(100vh - ${CONG_GIANG_VIEN_HEADER_HEIGHT}px)`,
            }}
          >
            <Content className="px-4 py-4">
              {unLayout ? (
                children
              ) : (
                <div
                  className={cn(
                    "min-h-[calc(100vh-96px)] rounded-lg bg-white p-4 shadow-sm",
                    className
                  )}
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
