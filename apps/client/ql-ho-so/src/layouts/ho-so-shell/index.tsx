import { HomeOutlined } from "@ant-design/icons"
import logo_mta from "@assets/images/hoso.svg"
import HeaderApp from "@components/header"
import SiderHoSo from "@components/layouts/sider"
import {
  QL_HO_SO_CONTENT_VERTICAL_OFFSET,
  QL_HO_SO_DEFAULT_SCHOOL_NAME,
  QL_HO_SO_HEADER_HEIGHT,
  QL_HO_SO_PORTAL_TITLE,
  QL_HO_SO_SIDEBAR_COLLAPSE_STORAGE_KEY,
  QL_HO_SO_SIDER_COLLAPSED_WIDTH,
  QL_HO_SO_SIDER_WIDTH,
} from "@constants/ql-ho-so-layout"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { useGetUnitInfosInfo } from "@workspace/libs/api/system"
import { getDynamicBreadcrumb } from "@workspace/permissions/hooks"
import { Breadcrumb, Button, Layout } from "antd"
import { Menu as MenuIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import packageInfo from "../../../package.json"

const { Header, Content, Footer } = Layout

interface BreadcrumbListProps {
  title: string
  href?: string
}

const readSidebarCollapsed = () =>
  typeof window !== "undefined" &&
  localStorage.getItem(QL_HO_SO_SIDEBAR_COLLAPSE_STORAGE_KEY) === "true"

const buildBreadcrumbItems = (
  breadcrumb: BreadcrumbListProps[] | undefined,
  breadcrumbList?: BreadcrumbListProps[]
) => {
  const items = breadcrumb?.length ? breadcrumb : breadcrumbList
  const mapped = items?.map((i) =>
    i.href ? { title: <Link href={i.href}>{i.title}</Link> } : { title: i.title }
  )

  return [
    {
      title: (
        <Link href="/home">
          <HomeOutlined className="mr-1" />
          Trang chủ
        </Link>
      ),
    },
    ...(mapped ?? []),
  ]
}

const HoSoShell = ({
  children,
  className,
  breadcrumbList,
  unLayout = false,
  showBreadcrumb = false,
  showFooter = true,
}: {
  children: ReactNode
  className?: string
  breadcrumbList?: BreadcrumbListProps[]
  unLayout?: boolean
  showBreadcrumb?: boolean
  showFooter?: boolean
}) => {
  const menus = useMenuList()
  const router = useRouter()
  const breadcrumb = getDynamicBreadcrumb("QL_HO_SO", router.pathname)
  const listBreadcrumb = useMemo(
    () => buildBreadcrumbItems(breadcrumb, breadcrumbList),
    [breadcrumb, breadcrumbList]
  )

  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)

  const handleCollapsed = (value?: boolean) => {
    if (typeof window === "undefined") return
    const newValue = value ?? !collapsed
    setCollapsed(newValue)
    localStorage.setItem(QL_HO_SO_SIDEBAR_COLLAPSE_STORAGE_KEY, newValue.toString())
  }

  useEffect(() => {
    setCollapsed(readSidebarCollapsed())
  }, [])

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const { data: unitInfoResponse } = useGetUnitInfosInfo()
  const unitInfo = unitInfoResponse?.data
  const schoolName = unitInfo?.sTenDayDu || QL_HO_SO_DEFAULT_SCHOOL_NAME
  const siderWidth = collapsed ? QL_HO_SO_SIDER_COLLAPSED_WIDTH : QL_HO_SO_SIDER_WIDTH

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout className="ho-so-layout h-screen overflow-hidden bg-[#f3f4f6]">
        <Header className="ho-so-header fixed top-0 left-0 right-0 z-[100] flex h-16 items-center justify-between border-none px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="text"
              aria-label="Thu gọn menu"
              className="ho-so-header-menu-btn"
              icon={<MenuIcon size={22} />}
              onClick={() => handleCollapsed(!collapsed)}
            />
            <div className="ho-so-header-logo">
              <Image src={logo_mta} alt="logo MTA" className="h-7 w-7" />
            </div>
            <div className="min-w-0 text-white leading-tight">
              <div className="truncate text-[11px] font-medium uppercase tracking-wide opacity-90">
                {schoolName}
              </div>
              <div className="truncate text-sm font-bold uppercase">{QL_HO_SO_PORTAL_TITLE}</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <HeaderApp className="ho-so-header-app" />
          </div>
        </Header>

        <Layout hasSider style={{ marginTop: QL_HO_SO_HEADER_HEIGHT }}>
          <SiderHoSo items={menus} collapsed={collapsed} />
          <Layout
            className="flex flex-col"
            style={{
              marginInlineStart: siderWidth,
              transition: "margin-inline-start 0.2s",
              height: `calc(100vh - ${QL_HO_SO_HEADER_HEIGHT}px)`,
              overflow: "hidden",
            }}
          >
            <Content
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-y-auto",
                unLayout ? "" : "px-2 py-2"
              )}
            >
              {showBreadcrumb ? (
                <div className={cn("mb-2 shrink-0", unLayout && "px-4 pt-4")}>
                  <Breadcrumb items={listBreadcrumb} />
                </div>
              ) : null}
              {unLayout ? (
                <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>
              ) : (
                <div
                  className={cn("rounded-lg bg-white p-4 shadow-sm", className)}
                  style={{
                    minHeight: `calc(100vh - ${QL_HO_SO_CONTENT_VERTICAL_OFFSET + (showFooter ? 40 : 0) + (showBreadcrumb ? 28 : 0)}px)`,
                  }}
                >
                  {children}
                </div>
              )}
            </Content>
            {showFooter ? (
              <Footer className="ho-so-footer flex shrink-0 items-center">
                <div>
                  {unitInfo?.sTenDayDu || QL_HO_SO_DEFAULT_SCHOOL_NAME} - Địa chỉ:{" "}
                  {unitInfo?.sDiaChi || "Số 236, Hoàng Quốc Việt, Cầu Giấy, Hà Nội"}
                </div>
                <div className="ml-auto">Phiên bản: {packageInfo.version}</div>
              </Footer>
            ) : null}
          </Layout>
        </Layout>
      </Layout>
    </IdleTimerProvider>
  )
}

export default HoSoShell
