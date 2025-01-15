import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { useStoreActions, useStoreState } from '@redux/hook'
import type { NextPage } from 'next'
import { useEffect } from 'react'
const IndexPage: NextPage = () => {
    const menus = useMenuList()
    const isUpdateAbility = useStoreState(
        (state) => state.appState.isUpdateAbility
    )
    const setIsUpdateAbility = useStoreActions(
        (actions) => actions.appState.setIsUpdateAbility
    )

    useEffect(() => {
        const firstMenu = menus.flat()

        if (firstMenu.length > 0) {
            window.location.href = firstMenu[0].path
        }
    }, [isUpdateAbility])

    return <Loading />
}
export default IndexPage
