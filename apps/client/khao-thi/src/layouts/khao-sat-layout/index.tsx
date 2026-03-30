import { cn } from "@lib/utils"

import { Layout } from "antd"
import type { ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const { Header, Content } = Layout

const KhaoSatLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <IdleTimerProvider timeout={Number.parseFloat("15") * 60 * 1000} onIdle={() => {}}>
      <Layout style={{ minHeight: "100vh" }} hasSider>
        <Layout
          style={{
            // marginInlineStart: collapsed ? 80 : 280, // Điều chỉnh margin theo trạng thái collapsed
            transition: "margin-inline-start 0.2s", // Hiệu ứng mượt
          }}
        >
          <Header className="flex items-center bg-white shadow-sm rounded-lg m-2">
            <span className="text-lg font-bold text-primary">KHẢO THÍ</span>
          </Header>
          <Content className="mx-2">
            <div
              className={cn(
                "min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm",
                className
              )}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </IdleTimerProvider>
  )
}

export default KhaoSatLayout
