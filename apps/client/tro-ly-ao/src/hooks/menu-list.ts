import { useStoreActions, useStoreState } from "@redux/hook"
import ability from "@workspace/permissions/ability"
import { useAbility, usePermissions } from "@workspace/permissions/hooks"
import NAVIGATION, { type TRO_LY_AO_PERMISSION } from "@workspace/router"
import { useEffect, useMemo } from "react"

// Menu item "← Chatbot" luôn hiển thị, không cần check quyền
const CHATBOT_MENU_ID = "tro-ly-ao"

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
          // Menu "Trợ lý ảo" (link về chatbot) luôn hiện, không check quyền
          if (menu.id === CHATBOT_MENU_ID) {
            return { ...menu, label: "← Chatbot" }
          }
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
        .filter((menu) => menu !== null)
        // Đưa "← Chatbot" lên đầu menu
        .sort((a, b) => (a.id === CHATBOT_MENU_ID ? -1 : b.id === CHATBOT_MENU_ID ? 1 : 0)),
    [isUpdateAbility, permissions, ability]
  )

  return menus
}

export { useMenuList }
