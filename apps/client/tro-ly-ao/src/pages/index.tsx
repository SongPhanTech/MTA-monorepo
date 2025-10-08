import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Page() {
    const router = useRouter()
    const query = router.query

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (query?.mode === 'quan-tri') {
            router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU)
        }
        if (query?.mode === 'tro-ly-ao') {
            router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
        }
    }, [query?.mode])
    return <Loading />
}
