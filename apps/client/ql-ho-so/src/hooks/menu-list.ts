import { useStoreActions, useStoreState } from "@redux/hook"
import { useSession } from "@workspace/auth/react"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissionsState } from "@workspace/permissions/hooks"
import NAVIGATION, { type QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useEffect, useMemo } from "react"

const useMenuList = () => {
  const isUpdateAbility = useStoreState((actions) => actions.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const { data: session, status: sessionStatus } = useSession()
  const userId = session?.sDM_NhanVienId || session?.userId || ""
  const { permissions, isReady } = usePermissionsState(userId)
  const { can } = useAbility()

  useEffect(() => {
    if (!session) return
    window.contextData = {
      userId: session.sDM_NhanVienId || session.userId,
      userName: session.username,
      organizationId: session.sDM_DonViId || session.organizationId,
    }
  }, [session])

  useEffect(() => {
    if (sessionStatus === "loading" || !sessionStatus) return
    if (sessionStatus === "unauthenticated") {
      setIsUpdateAbility(true)
      return
    }
    if (!isReady) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
    setIsUpdateAbility(true)
  }, [isReady, permissions, sessionStatus, setIsUpdateAbility])

  const menus = useMemo(
    () =>
      NAVIGATION.QL_HO_SO.menus
        .map((menu) => {
          if (menu.path === ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME) return menu
          if (menu.children) {
            const filteredChildren = menu.children.filter((child) => {
              return can(child.id as QL_HO_SO_PERMISSION, "XEM")
            })
            return filteredChildren.length > 0
              ? {
                  ...menu,
                  children: filteredChildren,
                }
              : null
          }
          return can(menu.id as QL_HO_SO_PERMISSION, "XEM") ? menu : null
        })
        .filter((menu) => menu !== null),
    [isUpdateAbility, permissions, can]
  )

  return {
    menus: process?.env?.NODE_ENV === "development" ? NAVIGATION.QL_HO_SO.menus : menus,
    isMenuReady: isUpdateAbility,
  }
}

export { useMenuList }
