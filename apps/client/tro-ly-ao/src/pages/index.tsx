import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Page() {
    const router = useRouter()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    }, [])
    return <Loading />
}
