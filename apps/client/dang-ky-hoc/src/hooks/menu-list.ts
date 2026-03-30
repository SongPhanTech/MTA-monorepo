import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION from "@workspace/router"
import { useEffect } from "react"

const useMenuList = () => {
  const isUpdateAbility = useStoreState((actions) => actions.appState.isUpdateAbility)
  const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
  const permissions = usePermissions()

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

  const menus = NAVIGATION.DANG_KY_HOC.menus

  return menus
}

export { useMenuList }
