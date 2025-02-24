import ability from '@lib/casl/ability'
import { useStoreActions } from '@redux/hook'
import { $Enums } from '@workspace/db'
import { useFindManyGroup } from '@workspace/db/hooks'
import NAVIGATION from '@workspace/router'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo } from 'react'
const useMenuList = () => {
    const { data } = useSession()
    const setIsUpdateAbility = useStoreActions(
        (actions) => actions.appState.setIsUpdateAbility
    )
    const { data: groups = [] } = useFindManyGroup({
        where: {
            users: {
                every: {
                    ssoId: data?.user.user_id
                }
            }
        },
        include: {
            roles: {
                include: {
                    permissions: true
                }
            }
        }
    })
    const permissions = useMemo(() => groups.flatMap((group) => group.roles.flatMap((role) => role.permissions)).filter((permission) => permission.permissionType === $Enums.PermissionType.READ), [groups])
    const permissionNames = useMemo(() => permissions.map((permission) => permission.name), [permissions])
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        ability.update(permissions.map((permission) => ({
            action: permission.permissionType,
            subject: permission.name
        })))
        setIsUpdateAbility(true)
    }, [permissions])


    const menus = NAVIGATION.QL_NGUOI_DUNG.menus.filter((menu) => {
        if (menu.children) {
            return menu.children.some((child) => permissionNames.includes(child.id))
        }
        return permissionNames.includes(menu.id)
    })
    return menus
}

export { useMenuList }
