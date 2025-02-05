import NAVIGATION from '@workspace/router'
import { useMemo } from 'react'

const useQuyenCoBan = () => {
    const quyenCoBan = useMemo(() => {
        return Object.entries(NAVIGATION).flatMap(([key, value]) =>
            value.menus.flatMap((menu) =>
                menu.children
                    ? menu.children.map((child) => ({
                          id: child.id,
                          label: child.label,
                          subSystem: key,
                          description: child.description,
                      }))
                    : {
                          id: menu.id,
                          label: menu.label,
                          subSystem: key,
                          description: menu.description,
                      }
            )
        )
    }, [])
    return quyenCoBan
}

export default useQuyenCoBan
