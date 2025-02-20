import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react'
import { useEffect } from 'react'
const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const { status } = useSession()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn('asgardeo')
        } else if (status === 'authenticated') {
            const firstMenu = menus.flat()
            if (firstMenu.length > 0 && firstMenu[0].path) {
                window.location.href = firstMenu[0].path
            }
        }
    }, [status])

    return <Loading />
}
export default IndexPage
