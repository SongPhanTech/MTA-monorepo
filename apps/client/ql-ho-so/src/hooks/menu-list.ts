import { useStoreActions, useStoreState } from "@redux/hook"
import { useSession } from "@workspace/auth/react"
import ability from "@workspace/permissions/ability"
import { PERMISSIONS, usePermissionsState } from "@workspace/permissions/hooks"
import NAVIGATION, { type QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useCallback, useEffect, useMemo, useState } from "react"

const showAllMenus = () =>
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    (window.location.host.startsWith("localhost") || window.contextData?.userName === "superadmin"))

const useMenuList = () => {
  const isUpdateAbility = useStoreState((actions) => actions.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const [abilityVersion, setAbilityVersion] = useState(0)
  const { data: session, status: sessionStatus } = useSession()
  const userId = session?.sDM_NhanVienId || session?.userId || ""
  const { permissions, isSuccess } = usePermissionsState(userId)

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
    // Only sync ability after a successful permissions query — never unlock on empty/error.
    if (!isSuccess) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
    setIsUpdateAbility(true)
    setAbilityVersion((version) => version + 1)
  }, [isSuccess, permissions, sessionStatus, setIsUpdateAbility])

  const canViewMenu = useCallback(
    (menuId: string) => {
      if (showAllMenus()) return true
      const found = permissions.find((permission) => permission.name === menuId)
      if (!found) return false
      return (found.permission & PERMISSIONS.XEM) === PERMISSIONS.XEM
    },
    [permissions]
  )

  const menus = useMemo(() => {
    if (showAllMenus()) return NAVIGATION.QL_HO_SO.menus

    return NAVIGATION.QL_HO_SO.menus
      .map((menu) => {
        if (menu.path === ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME) return menu
        if (menu.children) {
          const filteredChildren = menu.children.filter((child) => {
            return canViewMenu(child.id as QL_HO_SO_PERMISSION)
          })
          return filteredChildren.length > 0
            ? {
                ...menu,
                children: filteredChildren,
              }
            : null
        }
        return canViewMenu(menu.id as QL_HO_SO_PERMISSION) ? menu : null
      })
      .filter((menu) => menu !== null)
  }, [canViewMenu, abilityVersion, isUpdateAbility])

  const isMenuReady =
    sessionStatus === "unauthenticated" ||
    (sessionStatus === "authenticated" && showAllMenus()) ||
    (sessionStatus === "authenticated" && isSuccess && abilityVersion > 0)

  return {
    menus,
    isMenuReady,
  }
}

export { useMenuList }
