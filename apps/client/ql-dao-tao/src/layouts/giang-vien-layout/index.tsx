import logo_mta from "@assets/images/daotao.svg"
import SiderGiangVien from "@components/layouts/sider-giang-vien"
import ToggleVaiTro from "@components/layouts/toggle-vai-tro"
import { cn } from "@lib/utils"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { useGetUnitInfosInfo } from "@workspace/libs/api/system"
import { getVersion } from "@workspace/libs/api/training"
import { SelectTrainingObjectType, TreeSelectSemester } from "@workspace/ui"
import { Divider, Layout, theme } from "antd"
import Image from "next/image"
import { type ReactNode, useEffect, useState } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import { GIANG_VIEN_MENU } from "@/constants/giang-vien-menu"
import HeaderApp from "@/components/header"

const { Header, Content, Footer } = Layout

type Version = {
  Id: string
  sTenVersion: string
  sDescription: string
  dNgayPhatHanh: string
}

const APP_CODE = "lms"

const GiangVienLayout = ({
  children,
  className,
  unLayout = false,
}: {
  children: ReactNode
  className?: string
  unLayout?: boolean
}) => {
  const [version, setVersion] = useState<string>()
  const { data: unitInfoResponse } = useGetUnitInfosInfo()
  const unitInfo = unitInfoResponse?.data

  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("collapsed") === "true"
  })

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
      <Layout style={{ minHeight: "100vh" }} hasSider>
        <SiderGiangVien
          items={GIANG_VIEN_MENU}
          onCollapse={handleCollapsed}
          collapsed={collapsed}
          theme={"light"}
          logo1={<Image src={logo_mta} alt="logo MTA" className="size-10" />}
          logo2={
            <div className="flex items-center justify-center text-center">
              <Image src={logo_mta} alt="logo MTA" className="w-10 h-10 mr-2" />
              <span className="text-sm font-bold text-primary">CỔNG GIẢNG VIÊN</span>
            </div>
          }
        />
        <Layout
          style={{
            marginInlineStart: collapsed ? 80 : 230,
            transition: "margin-inline-start 0.2s",
          }}
        >
          <Header
            className={`flex justify-between items-center bg-white fixed z-[1000] top-0  ${collapsed ? "w-[calc(100%-80px)] left-[80px]" : "w-[calc(100%-230px)] left-[230px]"}`}
          >
            <div className="flex items-center gap-2">
              <SelectTrainingObjectType />
              <Divider type="vertical" className="bg-primary h-[30px]" />
              <div className="mr-2 font-bold">Học kỳ</div>
              <TreeSelectSemester />
            </div>
            <div className="flex items-center gap-2">
              <ToggleVaiTro />
              <HeaderApp />
            </div>
          </Header>
          <Content className="mx-2 mt-20 pb-[40px]">
            {unLayout ? (
              children
            ) : (
              <div
                className={cn(
                  "min-h-[calc(100vh-120px)] bg-white rounded-lg shadow-sm p-4",
                  className
                )}
                style={{ background: colorBgContainer }}
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

export default GiangVienLayout
