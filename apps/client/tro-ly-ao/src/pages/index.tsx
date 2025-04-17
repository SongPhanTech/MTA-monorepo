import Loading from '@components/commons/loading'
import TroLyAo from './tro-ly-ao'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { ROUTER_PATH } from '@workspace/router'

export default function Page() {
    const router = useRouter()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    }, [])

    return <Loading />
}
