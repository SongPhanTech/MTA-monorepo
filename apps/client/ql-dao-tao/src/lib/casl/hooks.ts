import NAVIGATION from '@workspace/router'
import ability from './ability'

const useAbility = () => {
    return {
        can: (action: string, subject: string) => ability.can(action, subject),
        cannot: (action: string, subject: string) =>
            ability.cannot(action, subject),
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
            const child = menu?.children?.find(child => child?.path === pathname)
            if (child) {
                // return `${menu?.label} / ${child?.label}`
                return `${child?.label}`
            }
        }
    }

    // Fallback
    return NAVIGATION[navKey]?.label || 'PHÂN HỆ QUẢN LÝ ĐÀO TẠO'
}

export { useAbility, getDynamicTitle }
