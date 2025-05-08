import type { $Enums } from '@workspace/db'
import NAVIGATION, { type ROUTER_PATH } from '@workspace/router'
import { useAbility } from './hooks'
import { useMenuList } from '@hooks/menu-list'
import { useMemo } from 'react'

type CanProps = {
    children: React.ReactNode
    I: keyof typeof ROUTER_PATH.QL_DAO_TAO
    a: $Enums.PermissionType
}
const menus = NAVIGATION.QL_DAO_TAO.menus.flatMap((menu) => {
    if (menu.children) {
        return menu.children.map((child) => ({
            id: child.id,
            path: child.path,
        }))
    }
    return {
        id: menu.id,
        path: menu.path,
    }
})
const Can = ({ children, I, a }: CanProps) => {
    const { can } = useAbility()
    const subject = useMemo(
        () => menus.find((menu) => menu.id === I)?.path ?? I,
        [I]
    )
    if (!can(subject, a)) {
        return null
    }
    return children
}

export { Can }
