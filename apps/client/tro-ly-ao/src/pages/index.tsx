import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { env } from '@/env'

const checkSessionQuietly = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${env.NEXT_PUBLIC_API_MODEL_BASE_URL}/api/auth/get-session`, {
            method: 'GET',
            credentials: 'include',
        })
        return response.ok
    } catch (error) {
        return false
    }
}

const Page: NextPage = () => {
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
            const isAuthenticated = await checkSessionQuietly()

            if (isAuthenticated) {
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
    }, [router.isReady, router.query.mode])

    return <Loading />
}
export default Page

// todo: tạm bỏ
// import Loading from '@components/commons/loading'
// import { ROUTER_PATH } from '@workspace/router'
// import { useRouter } from 'next/router'
// import { useEffect } from 'react'

// export default function Page() {
//     const router = useRouter()
//     const query = router.query

//     // biome-ignore lint/correctness/useExhaustiveDependencies: <>
//     useEffect(() => {
//         if (query?.mode === 'quan-tri') {
//             router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
//         }
//         if (query?.mode === 'tro-ly-ao') {
//             router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
//         }
//     }, [query?.mode])
//     return <Loading />
// }
