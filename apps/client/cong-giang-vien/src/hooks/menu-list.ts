import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION, { type CONG_GIANG_VIEN_PERMISSION } from "@workspace/router"
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
      NAVIGATION.CONG_GIANG_VIEN.menus
        .map((menu) => {
          if (menu.children) {
            const filteredChildren = menu.children.filter((child) => {
              return can(child.id as CONG_GIANG_VIEN_PERMISSION, "XEM")
            })
            return filteredChildren.length > 0
              ? {
                  ...menu,
                  children: filteredChildren,
                }
              : null
          }
          return can(menu.id as CONG_GIANG_VIEN_PERMISSION, "XEM") ? menu : null
        })
        .filter((menu) => menu !== null),
    [isUpdateAbility, permissions, ability]
  )

  return process?.env?.NODE_ENV === "development" ? NAVIGATION.CONG_GIANG_VIEN.menus : menus
}

export { useMenuList }
