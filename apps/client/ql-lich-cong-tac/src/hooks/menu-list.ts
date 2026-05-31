import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION, { type QL_LICH_CONG_TAC_PERMISSION } from "@workspace/router"
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
      NAVIGATION.QL_LICH_CONG_TAC.menus
        .map((menu) => {
          if (menu.children) {
            const filteredChildren = menu.children.filter((child) => {
              return can(child.id as QL_LICH_CONG_TAC_PERMISSION, "XEM")
            })
            return filteredChildren.length > 0
              ? {
                  ...menu,
                  children: filteredChildren,
                }
              : null
          }
          return can(menu.id as QL_LICH_CONG_TAC_PERMISSION, "XEM") ? menu : null
        })
        .filter((menu) => menu !== null),
    [isUpdateAbility, permissions, ability]
  )

  return process?.env?.NODE_ENV === "development" ? NAVIGATION.QL_LICH_CONG_TAC.menus : menus
}

export { useMenuList }
