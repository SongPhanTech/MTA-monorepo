import NAVIGATION from '@workspace/router'
import { useMemo } from 'react'

const useQuyenCoBan = () => {
    const quyenCoBan = useMemo(() => {
        return Object.entries(NAVIGATION).flatMap(([key, value]) =>
            value.menus.flatMap((menu, idx) => ({
                id: menu.id,
                label: menu.label,
                subSystem: key,
                description: menu.description,
                index: `${idx + 1}`,
                children: menu.children?.map((child, idxChild) => ({
                    ...child,
                    index: `${idx + 1}.${idxChild + 1}`,
                })),
            }))
        )
    }, [])
    return quyenCoBan
}

export default useQuyenCoBan
