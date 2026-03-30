import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION, { type TRO_LY_AO_PERMISSION } from "@workspace/router"
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
      NAVIGATION.TRO_LY_AO.menus
        .map((menu) => {
          if (menu.children) {
            const filteredChildren = menu.children.filter((child) => {
              return can(child.id as TRO_LY_AO_PERMISSION, "XEM")
            })
            return filteredChildren.length > 0
              ? {
                  ...menu,
                  children: filteredChildren,
                }
              : null
          }
          return can(menu.id as TRO_LY_AO_PERMISSION, "XEM") ? menu : null
        })
        .filter((menu) => menu !== null),
    [isUpdateAbility, permissions, ability]
  )

  return menus
}

export { useMenuList }
