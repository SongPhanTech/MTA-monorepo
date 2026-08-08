import logo_mta from "@assets/images/khaothi.svg"
import SiderDefaultLayout from "@components/layouts/sider"
import { KHAO_THI_PORTAL_TITLE } from "@constants/khao-thi-layout"
import { cn } from "@lib/utils"
import type { MenuItem } from "@workspace/router"
import { Button, Layout } from "antd"
import { Menu as MenuIcon } from "lucide-react"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import HeaderApp from "@/components/header"

const { Header, Content } = Layout

const SIDER_WIDTH = 250
const SIDER_COLLAPSED_WIDTH = 80
const HEADER_HEIGHT = 64
const CONTENT_VERTICAL_OFFSET = HEADER_HEIGHT + 32

const readSidebarCollapsed = () =>
  typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"

export type PortalShellProps = {
  children: ReactNode
  className?: string
  unLayout?: boolean
  items: MenuItem[]
  headerExtra?: ReactNode
  contentVariant?: "card" | "plain"
}

const PortalShell = ({
  children,
  className,
  unLayout = false,
  items,
  headerExtra,
  contentVariant = "card",
}: PortalShellProps) => {
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

  const siderWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH

  return (
    <Layout className="sinh-vien-layout h-screen overflow-hidden bg-[#f3f4f6]">
      <Header className="sinh-vien-header fixed top-0 left-0 right-0 z-[100] flex h-16 items-center justify-between border-none px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
            <div className="truncate text-sm font-bold uppercase">{KHAO_THI_PORTAL_TITLE}</div>
          </div>
          {headerExtra ? (
            <div className="khao-thi-header-filters ml-4 hidden min-w-0 items-center gap-3 md:flex">
              {headerExtra}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <HeaderApp className="sinh-vien-header-app" />
        </div>
      </Header>

      <Layout hasSider style={{ marginTop: HEADER_HEIGHT }}>
        <SiderDefaultLayout items={items} collapsed={collapsed} />
        <Layout
          style={{
            marginInlineStart: siderWidth,
            transition: "margin-inline-start 0.2s",
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            overflow: "hidden",
          }}
        >
          <Content
            className={cn(
              "flex h-full flex-col px-2 py-2",
              contentVariant === "plain" && "px-0 py-0"
            )}
          >
            {unLayout ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            ) : contentVariant === "plain" ? (
              <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>{children}</div>
            ) : (
              <div
                className={cn("overflow-y-auto rounded-lg bg-white p-4 shadow-sm", className)}
                style={{
                  height: `calc(100vh - ${CONTENT_VERTICAL_OFFSET}px)`,
                }}
              >
                {children}
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default PortalShell
