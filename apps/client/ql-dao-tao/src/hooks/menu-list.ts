import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility } from "@workspace/permissions/hooks"
import { useGetDelegatedPermissions } from "@workspace/libs/api/training"
import { useGetPermission } from "@workspace/libs/api/get-permission"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { getMenuIdsShownInCatalog } from "@components/layouts/catalog-config-menu"
import NAVIGATION, { type QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useEffect, useMemo, useState } from "react"

type PermissionMask = {
  name: string
  permission: number
}

const mergePermissions = (system: PermissionMask[], delegated: PermissionMask[]) => {
  const merged = new Map<string, number>()
  for (const item of [...system, ...delegated]) {
    if (!item.name) continue
    merged.set(item.name, (merged.get(item.name) ?? 0) | item.permission)
  }
  return [...merged.entries()].map(([name, permission]) => ({ name, permission }))
}

const showAllMenus = () =>
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    (window.location.host.startsWith("localhost") || window.contextData?.userName === "superadmin"))

const useMenuList = () => {
  const isUpdateAbility = useStoreState((actions) => actions.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const [abilityVersion, setAbilityVersion] = useState(0)
  const { can } = useAbility()
  const userId = typeof window === "undefined" ? "" : (window.contextData?.userId ?? "")
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE")
  const permissionQuery = useGetPermission(appCode, userId)
  const delegatedQuery = useGetDelegatedPermissions(
    { userId },
    { query: { enabled: Boolean(userId) } }
  )

  const systemPermissions = useMemo(() => {
    if (permissionQuery.data?.status !== 200) return []
    return (permissionQuery.data.data.Permissions ?? []).map((permission) => ({
      name: permission.sFormName ?? "",
      permission: permission.lPermission ?? 0,
    }))
  }, [permissionQuery.data])

  const delegatedPermissions = useMemo(() => {
    if (delegatedQuery.data?.status !== 200) return []
    return delegatedQuery.data.data.permissions
  }, [delegatedQuery.data])

  const permissions = useMemo(
    () => mergePermissions(systemPermissions, delegatedPermissions),
    [systemPermissions, delegatedPermissions]
  )

  const permissionEnabled = Boolean(appCode && userId)
  const permissionSettled = !permissionEnabled || permissionQuery.isFetched
  const delegatedSettled = !userId || delegatedQuery.isFetched

  useEffect(() => {
    if (!permissionSettled || !delegatedSettled) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
    setIsUpdateAbility(true)
    setAbilityVersion((version) => version + 1)
  }, [permissions, permissionSettled, delegatedSettled, setIsUpdateAbility])

  const menus = useMemo(() => {
    const shownInCatalog = getMenuIdsShownInCatalog()
    const visibleMenus = NAVIGATION.QL_DAO_TAO.menus.filter(
      (menu) => !menu.hidden && !shownInCatalog.has(menu.id)
    )
    if (showAllMenus()) return visibleMenus

    return visibleMenus
      .map((menu) => {
        if (menu.children) {
          const filteredChildren = menu.children.filter((child) => {
            return can(child.id as QL_DAO_TAO_PERMISSION, "XEM")
          })
          return filteredChildren.length > 0
            ? {
                ...menu,
                children: filteredChildren,
              }
            : null
        }
        return can(menu.id as QL_DAO_TAO_PERMISSION, "XEM") ? menu : null
      })
      .filter((menu) => menu !== null)
  }, [isUpdateAbility, permissions, abilityVersion, can])

  return menus
}

export { useMenuList }
