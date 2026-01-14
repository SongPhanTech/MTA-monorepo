import Loading from '@components/commons/loading'
import { useSSOSession } from '@/hooks/useSSOSession'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPage } from 'next'

const IndexPage: NextPage = () => {
    const { status } = useSSOSession()
    const router = useRouter()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (!router.isReady) return

        const { mode } = router.query

        if (mode === 'quan-tri') {
            router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
            return
        }
        if (mode === 'tro-ly-ao') {
            router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
            return
        }

        const handleRedirect = async () => {
            if (status === 'authenticated') {
                const lastPage = localStorage.getItem('lastPage')
                const lastSubsystem = localStorage.getItem('lastSubsystem')

                if (lastPage && lastPage !== '/' && lastSubsystem?.includes('chatbot')) {
                    router.replace(lastPage)
                } else {
                    router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
                }
            } else {
                router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
            }
        }

        handleRedirect()
    }, [router.isReady, router.query.mode, status])

    return <Loading />
}

export default IndexPage