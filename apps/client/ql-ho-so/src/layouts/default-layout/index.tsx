import { HomeOutlined } from "@ant-design/icons"
import logo_mta from "@assets/images/hoso.svg"
import SiderDefaultLayout from "@components/layouts/sider"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
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
import { Footer } from "antd/es/layout/layout"
import { getVersion } from "@workspace/libs/api/training"
const { Header, Content } = Layout
interface breadcrumListProps {
  title: string
  href?: string
}
type Version = {
  Id: string
  sTenVersion: string
  sDescription: string
  dNgayPhatHanh: string
}
const APP_CODE = "hrm"
const DefaultLayout = ({
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
  const [version, setVersion] = useState<string>()
  const router = useRouter()
  const currentPath = router.pathname
  const breadcrumb = getDynamicBreadcrumb("QL_HO_SO", currentPath)
  useEffect(() => {
    const fetchVersion = async () => {
      const res = await getVersion(APP_CODE)
      if (res.status === 200) {
        const versionData = res.data as Version[]
        setVersion(versionData?.[0]?.sTenVersion)
      }
    }
    fetchVersion()
  }, [])

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
        <SiderDefaultLayout
          logo1={<Image src={logo_mta} alt="logo MTA" className="size-10" />}
          logo2={
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-10 mr-3" />
              <span className="text-base font-bold color text-[#212121]">Quản lý hồ sơ</span>
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
            className={`flex justify-between items-center bg-white shadow-sm mb-2 fixed z-[1000] top-0  ${collapsed ? "w-[calc(100%-80px)] left-[80px]" : "w-[calc(100%-230px)] left-[230px]"}`}
          >
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
                className={cn(
                  "min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4",
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
      <Footer className="fixed bottom-0 w-full z-[1000] flex items-center p-2">
        <div>Học viện Kỹ thuật Quân sự - Địa chỉ: Số 236, Hoàng Quốc Việt, Cầu Giấy, Hà Nội</div>
        <div className="ml-auto">Phiên bản: {version ?? "..."}</div>
      </Footer>
    </IdleTimerProvider>
  )
}

export default DefaultLayout
