import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Page() {
    const router = useRouter()
    // const { status } = useSession()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        // if (status === 'unauthenticated') {
        // signIn()
        // } else if (status === 'authenticated') {
        router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
        // }
    }, [])
    // }, [status])

    return <Loading />
}
