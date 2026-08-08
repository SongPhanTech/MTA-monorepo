import PortalShell from "@components/layouts/portal-shell"
import { useMenuList } from "@hooks/menu-list"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { SelectTrainingObjectType, TreeSelectSemester } from "@workspace/ui"
import { Divider } from "antd"
import { type ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const ExamLayout = ({
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
    <>
      <SelectTrainingObjectType subsystem="ems" />
      <Divider type="vertical" className="khao-thi-header-divider-vertical h-[30px]" />
      <div className="flex items-center gap-2">
        <span className="font-semibold">Học kỳ</span>
        <TreeSelectSemester />
      </div>
    </>
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
    </IdleTimerProvider>
  )
}

export default ExamLayout
