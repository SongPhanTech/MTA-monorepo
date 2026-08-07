import PortalShell from "@components/layouts/portal-shell"
import { useMenuList } from "@hooks/menu-list"
import { CONFIG_KEY } from "@workspace/constant"
import { useFindUniqueConfig } from "@workspace/db/hooks"
import { type ReactNode } from "react"
import { IdleTimerProvider } from "react-idle-timer"

const CreateLayout = ({
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

  return (
    <IdleTimerProvider
      timeout={Number.parseFloat(userSessionTimeout?.value || "15") * 60 * 1000}
      onIdle={() => {}}
    >
      <PortalShell items={menus} className={className} unLayout={unLayout} contentVariant="plain">
        {children}
      </PortalShell>
    </IdleTimerProvider>
  )
}

export default CreateLayout
