import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { useSession } from '@workspace/auth/react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const { status, goToLastPage } = useSession()
    const router = useRouter()

    useEffect(() => {
        console.log(status)
        if (status === 'authenticated') {
            if (goToLastPage('portal')) return
            const firstMenu = menus.flat()
            if (firstMenu.length > 0 && firstMenu[0].path) {
                router.push(firstMenu[0].path)
            }
        }
    }, [status, goToLastPage, menus.flat, router.push])
    return <Loading />
}
export default IndexPage
