import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility } from "@workspace/permissions/hooks"
import { useGetUserPermissionsPermissionAppCodeUserId } from "@workspace/libs/api/system"
import { getRuntimeEnv } from "@workspace/libs/utils"
import NAVIGATION, { type CONG_HOC_VIEN_PERMISSION } from "@workspace/router"
import { useEffect, useMemo, useState } from "react"

const showAllMenus = () =>
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    (window.location.host.startsWith("localhost") || window.contextData?.userName === "superadmin"))

const useMenuList = () => {
  const isUpdateAbility = useStoreState((state) => state.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const [abilityVersion, setAbilityVersion] = useState(0)
  const { can } = useAbility()
  // SSO Header gán window.contextData sau khi mount — lắng nghe để query quyền khi có userId
  const [userId, setUserId] = useState(
    () => (typeof window !== "undefined" ? (window.contextData?.userId ?? "") : "")
  )
  useEffect(() => {
    if (typeof window === "undefined" || userId) return
    const timer = setInterval(() => {
      const next = window.contextData?.userId ?? ""
      if (next) setUserId(next)
    }, 300)
    return () => clearInterval(timer)
  }, [userId])
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE")
  const systemQuery = useGetUserPermissionsPermissionAppCodeUserId(appCode, userId)

  const permissions = useMemo(() => {
    if (systemQuery.data?.status !== 200) return []
    return (systemQuery.data.data.Permissions ?? []).map((permission) => ({
      name: permission.sFormName ?? "",
      permission: permission.lPermission ?? 0,
    }))
  }, [systemQuery.data])

  const systemEnabled = Boolean(appCode && userId)
  const systemSettled = !systemEnabled || systemQuery.isFetched

  useEffect(() => {
    if (!systemSettled) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
    setIsUpdateAbility(true)
    setAbilityVersion((version) => version + 1)
  }, [permissions, systemSettled, setIsUpdateAbility])

  const menus = useMemo(() => {
    const visibleMenus = NAVIGATION.CONG_HOC_VIEN.menus.filter((menu) => !menu.hidden)
    if (showAllMenus()) return visibleMenus

    return visibleMenus
      .map((menu) => {
        if (menu.children) {
          const filteredChildren = menu.children.filter((child) => {
            return can(child.id as CONG_HOC_VIEN_PERMISSION, "XEM")
          })
          return filteredChildren.length > 0
            ? {
                ...menu,
                children: filteredChildren,
              }
            : null
        }
        return can(menu.id as CONG_HOC_VIEN_PERMISSION, "XEM") ? menu : null
      })
      .filter((menu) => menu !== null)
  }, [isUpdateAbility, permissions, abilityVersion, can])

  return menus
}

export { useMenuList }
