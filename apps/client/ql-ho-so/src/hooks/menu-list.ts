import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION, { type QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useEffect, useMemo } from "react"

const useMenuList = () => {
  const isUpdateAbility = useStoreState((actions) => actions.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const permissions = usePermissions()
  const { can } = useAbility()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (!permissions.length) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
    setIsUpdateAbility(true)
  }, [permissions])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  const menus = useMemo(
    () =>
      NAVIGATION.QL_HO_SO.menus
        .map((menu) => {
          if (menu.path === ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME) return menu // Luôn hiển thị menu "Hồ sơ của tôi"
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
    [isUpdateAbility, permissions, ability]
  )

  return process?.env?.NODE_ENV === "development" ? NAVIGATION.QL_HO_SO.menus : menus
}

export { useMenuList }
