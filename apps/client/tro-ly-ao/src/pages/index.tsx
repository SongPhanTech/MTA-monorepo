import Loading from '@components/commons/loading'
import TroLyAo from './tro-ly-ao'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { ROUTER_PATH } from '@workspace/router'
import { useMenuList } from '@hooks/menu-list'
import { signIn, useSession } from 'next-auth/react'

export default function Page() {
    const router = useRouter()
    const menus = useMenuList()
    const { status } = useSession()
    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn('asgardeo')
        } else if (status === 'authenticated') {
            const firstMenu = menus.flat()
            if (firstMenu.length > 0 && firstMenu[0].path) {
                window.location.href = firstMenu[0].path
            }
        }
    }, [status, menus])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    }, [])

    return <Loading />
}
