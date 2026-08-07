import PortalShell from "@components/layouts/portal-shell"
import { useMenuList } from "@hooks/menu-list"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { type ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const DashboardLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
  const menus = useMenuList()

  const { data: userSessionTimeout } = useFindUniqueConfig({
    where: {
      key: CONFIG_KEY.USER_SESSION_TIMEOUT,
    },
  })

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <PortalShell items={menus} className={className} contentVariant="plain">
        {children}
      </PortalShell>
    </IdleTimerProvider>
  )
}

export default DashboardLayout
