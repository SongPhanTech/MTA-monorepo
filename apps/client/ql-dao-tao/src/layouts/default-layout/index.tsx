import logo_mta from "@assets/images/daotao.svg"
import SidebarMenuLayout from "@components/layouts/sider"
import { useMenuList } from "@hooks/menu-list"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { useGetUnitInfosInfo } from "@workspace/libs/api/system"
import { getVersion } from "@workspace/libs/api/training"
import { getDynamicBreadcrumb } from "@workspace/permissions/hooks"
import { SelectTrainingObjectType, TreeSelectSemester } from "@workspace/ui"
import { Breadcrumb, Divider, Layout, Tooltip, theme } from "antd"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import HeaderApp from "@/components/header"
import packageInfo from "../../../package.json"

const { Header, Content, Footer } = Layout
interface BreadcrumbListProps {
  title: string
  href?: string
}
type Version = {
  Id: string
  sTenVersion: string
  sDescription: string
  dNgayPhatHanh: string
}
const APP_CODE = "lms"
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
  const [version, setVersion] = useState<string>()
  const router = useRouter()
  const currentPath = router.pathname
  const { data: unitInfoResponse } = useGetUnitInfosInfo()
  const unitInfo = unitInfoResponse?.data
  const breadcrumb = getDynamicBreadcrumb("QL_DAO_TAO", currentPath)
  const listBreadcrumb = useMemo(() => {
    return breadcrumb?.length > 0
      ? breadcrumb.slice(-2).map((i: { title: string; href?: string }) => {
            if (i?.href) {
              return {
                title: <Link href={i.href}>{i.title}</Link>,
              }
            }
            return {
              title: i.title,
            }
          })
      : breadcrumbList
        ? breadcrumbList.slice(-2).map((i: { title: string; href?: string }) => {
              if (i?.href) {
                return {
                  title: <Link href={i.href}>{i.title}</Link>,
                }
              }
              return {
                title: i.title,
              }
            })
        : []
  }, [breadcrumb, breadcrumbList])
  useEffect(() => {
    const fetchVersion = async () => {
      const res = await getVersion(APP_CODE)
      if (res.status === 200) {
        const versionData = res.data as unknown as Version[]
        setVersion(versionData?.[0]?.sTenVersion)
      }
    }
    fetchVersion()
  }, [])
  const menus = useMenuList()

  const menusFlat = menus.flatten("children")

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <Layout
        style={{
          transition: "margin-inline-start 0.2s", // Hiệu ứng mượt
          minHeight: "100vh",
        }}
      >
        <Header
          className={
            "flex justify-between items-center bg-white shadow-sm fixed z-[1000] top-0 w-full px-2 h-fit border-b-primary border-b"
          }
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-8" />
              <span className="text-base font-bold color text-primary">Quản lý đào tạo</span>
            </div>
            <Divider type="vertical" className="bg-primary h-[30px]" />
            <SelectTrainingObjectType />
            <Divider type="vertical" className="bg-primary h-[30px]" />
            <Tooltip title="Học kỳ">
              <div className="mr-2 font-bold">Học kỳ</div>
            </Tooltip>
            <TreeSelectSemester />
            <Divider type="vertical" className="bg-primary h-[30px]" />
            <Breadcrumb className="text-xs" items={listBreadcrumb} />
          </div>
          <div className="flex items-center gap-2">
            <HeaderApp />
          </div>
        </Header>
        <SidebarMenuLayout items={menus} theme={"light"} />
        <Content className="pb-[35px] mt-[110px] p-2 bg-white">
          {unLayout ? (
            children
          ) : (
            <div
              className={cn(
                // 'min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4',
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
        <Footer className="fixed bottom-0 w-full z-[1000] flex items-center p-2">
          <div>
            {unitInfo?.sTenDayDu || "Học viện Kỹ thuật Quân sự"} - Địa chỉ:{" "}
            {unitInfo?.sDiaChi || "Số 236, Hoàng Quốc Việt, Cầu Giấy, Hà Nội"}
          </div>
          <div className="ml-auto">Phiên bản: {(version || packageInfo.version) ?? "..."}</div>
        </Footer>
      </Layout>
    </IdleTimerProvider>
  )
}

export default DefaultLayout
