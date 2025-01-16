import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { useStoreActions, useStoreState } from '@redux/hook'
import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react'
import { useEffect } from 'react'
const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const { status } = useSession()
    const isUpdateAbility = useStoreState(
        (state) => state.appState.isUpdateAbility
    )
    const setIsUpdateAbility = useStoreActions(
        (actions) => actions.appState.setIsUpdateAbility
    )

    useEffect(() => {
        if (status == 'unauthenticated') {
            signIn('asgardeo')
        } else if (status == 'authenticated') {
            const firstMenu = menus.flat()
            if (firstMenu.length > 0 && firstMenu[0].path) {
                window.location.href = firstMenu[0].path
            }
        }
    }, [isUpdateAbility, status])

    return <Loading />
}
export default IndexPage
