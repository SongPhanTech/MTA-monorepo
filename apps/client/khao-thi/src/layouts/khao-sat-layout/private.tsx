import { cn } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { Layout, theme } from "antd"
import { useRouter } from "next/router"
import type { ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import HeaderApp from "@/components/header"

const { Header, Content } = Layout
interface breadcrumListProps {
  title: string
  href?: string
}

const KhaoSatPrivateLayout = ({
  children,
  className,
  headerName,
  unLayout = false,
}: {
  children: ReactNode
  className?: string
  headerName?: string
  unLayout?: boolean
}) => {
  const router = useRouter()
  const { status } = useSession()
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
        <Layout
          style={{
            marginInlineStart: 0, // Điều chỉnh margin theo trạng thái collapsed
            transition: "margin-inline-start 0.2s", // Hiệu ứng mượt
          }}
        >
          <Header className="flex justify-between items-center bg-white shadow-sm mb-2 fixed z-[1000] top-0  w-full">
            <div className="text-lg font-bold text-primary">{headerName || "KHẢO THÍ"} </div>
            <HeaderApp />
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
    </IdleTimerProvider>
  )
}

export default KhaoSatPrivateLayout
