import Loading from '@components/commons/loading'
import { useMenuList } from '@hooks/menu-list'
import { ROUTER_PATH } from '@workspace/router'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Page() {
    const router = useRouter()
    const menus = useMenuList()
    const { status } = useSession()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn('asgardeo')
        } else if (status === 'authenticated') {
            router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
        }
    }, [status, menus])

    return <Loading />
}
