import { useStoreActions } from '@redux/hook'
import ability from '@workspace/permissions/ability'
import { PERMISSIONS, usePermissions } from '@workspace/permissions/hooks'
import NAVIGATION from '@workspace/router'
import { useEffect } from 'react'

const useMenuList = () => {
    const setIsUpdateAbility = useStoreActions((actions) => actions.appState.setIsUpdateAbility)
    const permissions = usePermissions()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        ability.update(
            permissions.map((permission) => ({
                action: String(permission.permission),
                subject: permission.name,
            }))
        )
        setIsUpdateAbility(true)
    }, [permissions])

    const menus = NAVIGATION.TRO_LY_AO.menus.filter((menu) => {
        if (menu.children) {
            return {
                ...menu,
                children: menu.children.filter(
                    (child) =>
                        (Number(ability.actionsFor(child.id).pop()) & PERMISSIONS.XEM) ===
                        PERMISSIONS.XEM
                ),
            }
        }
        return (
            menu &&
            (Number(ability.actionsFor(menu.id).pop()) & PERMISSIONS.XEM) === PERMISSIONS.XEM
        )
    })
    return menus
}

export { useMenuList }
