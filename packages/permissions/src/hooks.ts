import NAVIGATION, {
    type KHAO_THI_PERMISSION,
    type PORTAL_PERMISSION,
    type QL_DAO_TAO_PERMISSION,
    type TRO_LY_AO_PERMISSION,
} from '@workspace/router'
import { useMemo } from 'react'
import { useGetUserPermissionsPermissionAppCodeUserId } from '../../libs/src/api/system'
import ability from './ability'

declare global {
    interface Window {
        contextData: {
            userId: string
        }
    }
}

const PERMISSIONS = {
    XEM: 1, // 001
    SUA: 2, // 010
    THEM: 4, // 100
    XOA: 8, // 1000
}

const useAbility = () => {
    return {
        can: (
            action: number,
            subject:
                | KHAO_THI_PERMISSION
                | PORTAL_PERMISSION
                | QL_DAO_TAO_PERMISSION
                | TRO_LY_AO_PERMISSION
        ) => (Number(ability.actionsFor(subject).pop()) & action) === action,
        cannot: (action: number, subject = '') =>
            (Number(ability.actionsFor(subject).pop()) & action) !== action,
    }
}

function getDynamicTitle(navKey: keyof typeof NAVIGATION, pathname: string): string {
    const menus = NAVIGATION[navKey]?.menus || []

    for (const menu of menus) {
        // Không có children
        if (!menu?.children && pathname === menu?.path) {
            return menu?.label as string
        }

        // Có children
        if (menu?.children) {
            const child = menu?.children?.find((child) => child?.path === pathname)
            if (child) {
                // return `${menu?.label} / ${child?.label}`
                return `${child?.label}`
            }
        }
    }

    // Fallback
    return NAVIGATION[navKey]?.label || 'PHÂN HỆ QUẢN LÝ ĐÀO TẠO'
}

function getDynamicBreadcrumb(
    navKey: keyof typeof NAVIGATION,
    pathname: string
): { title: string; href?: string }[] | [] {
    const menus = NAVIGATION[navKey]?.menus || []
    for (const menu of menus) {
        // Không có children
        if (!menu?.children && pathname === menu?.path) {
            return [{ title: menu?.label as string }]
        }

        // Có children
        if (menu?.children) {
            const child = menu?.children?.find((child) => child?.path === pathname)
            if (child) {
                // return `${menu?.label} / ${child?.label}`
                return [{ title: menu?.label as string }, { title: child?.label as string }]
            }
        }
    }

    // Fallback
    return []
}

const usePermissions = () => {
    const { data } = useGetUserPermissionsPermissionAppCodeUserId(
        process.env.NEXT_PUBLIC_APP_CODE || 'lms',
        window?.contextData?.userId ?? ''
    )

    const permissions = useMemo(() => {
        if (data?.status !== 200) return []
        const permissions: Array<{
            name: string
            permission: number
        }> = []

        data.data.Permissions?.forEach((p) => {
            permissions.push({
                name: p.sFormName ?? '',
                permission: p.lPermission ?? 0,
            })
        })
        return permissions
    }, [data])

    return permissions
}

export { useAbility, usePermissions, PERMISSIONS, getDynamicTitle, getDynamicBreadcrumb }
