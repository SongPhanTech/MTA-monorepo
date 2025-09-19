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

    const menus = NAVIGATION.QL_DAO_TAO.menus
        .map((menu) => {
            if (menu.children) {
                const filteredChildren = menu.children.filter((child) => {
                    return (
                        (Number(ability.actionsFor(child.id).pop()) & PERMISSIONS.XEM) ===
                        PERMISSIONS.XEM
                    )
                })
                return filteredChildren.length > 0
                    ? {
                          ...menu,
                          children: filteredChildren,
                      }
                    : null
            }
            return (Number(ability.actionsFor(menu.id).pop()) & PERMISSIONS.XEM) === PERMISSIONS.XEM
                ? menu
                : null
        })
        .filter((menu) => menu !== null)
    return menus
}

export { useMenuList }
