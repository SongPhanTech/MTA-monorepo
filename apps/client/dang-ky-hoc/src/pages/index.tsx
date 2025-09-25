import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { useSession } from '@workspace/auth/react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { env } from '@/env'

const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const { status, goToLastPage } = useSession()
    const router = useRouter()
    const flatMenus = menus.flat()

    useEffect(() => {
        if (status === 'authenticated') {
            if (goToLastPage(env.NEXT_PUBLIC_BASE_PATH)) return
            const firstMenu = flatMenus
            if (firstMenu.length > 0 && firstMenu[0].path) {
                router.push(firstMenu[0].path)
            }
        }
    }, [status, goToLastPage, flatMenus.length, flatMenus, router.push])
    return <Loading />
}
export default IndexPage
