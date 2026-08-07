import PortalShell from "@components/layouts/portal-shell"
import { SelecterSchoolYear } from "@components/selecter-school-year"
import { useMenuList } from "@hooks/menu-list"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { Tooltip } from "antd"
import { type ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"
import { Footer } from "antd/es/layout/layout"
import packageInfo from "../../../package.json"

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

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  const headerExtra = (
    <div className="flex items-center gap-2">
      <Tooltip title="Năm học">
        <span className="font-semibold">Năm học</span>
      </Tooltip>
      <SelecterSchoolYear />
    </div>
  )

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <PortalShell
        items={menus}
        className={className}
        unLayout={unLayout}
        headerExtra={headerExtra}
      >
        {children}
      </PortalShell>
      <Footer className="fixed bottom-0 w-full z-[1000] flex items-center p-2">
        <div>Học viện Kỹ thuật Quân sự - Địa chỉ: Số 236, Hoàng Quốc Việt, Cầu Giấy, Hà Nội</div>
        <div className="ml-auto">Phiên bản: {packageInfo.version}</div>
      </Footer>
    </IdleTimerProvider>
  )
}

export default EvaluateLayout
