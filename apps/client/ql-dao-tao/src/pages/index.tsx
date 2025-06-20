import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { signIn, useSession } from '@workspace/auth/react'
import type { NextPage } from 'next'
import { useEffect } from 'react'
const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const { status } = useSession()
    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn()
        } else if (status === 'authenticated') {
            const firstMenu = menus.flat()
            if (firstMenu.length > 0 && firstMenu[0].path) {
                window.location.href = firstMenu[0].path
            }
        }
    }, [status, menus])
    return <Loading />
}
export default IndexPage
