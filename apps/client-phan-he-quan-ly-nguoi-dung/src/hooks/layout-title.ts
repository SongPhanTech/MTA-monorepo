import { useMenuList } from '@hooks/menu-list'
import { usePathname } from 'next/navigation'

const useLayoutTitle = () => {
    const pathname = usePathname()
    const menuList = useMenuList()
    return menuList
        .flatMap((menu) => (menu.children ? menu.children : menu))
        .find((e) => e.path && pathname == e.path)
        ?.label.toUpperCase()
}

export default useLayoutTitle
