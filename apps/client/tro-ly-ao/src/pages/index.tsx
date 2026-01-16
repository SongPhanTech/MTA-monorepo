// Trong code này có 2 chỗ hardcode 1 là trong header set appcode = chatbot
// 2 là trong useSSOsession set appcode = chatbot dòng 208         window.location.href = `${getRuntimeEnv('NEXT_PUBLIC_AUTH_ISSUER')}/authsso/signin?appCode=chatbot&tenantCode=${tenantCode}&sRedirectDefault=${getRuntimeEnv('NEXT_PUBLIC_APP_URL')}`
// 3 là trong useSSOsession dòng 127
// Ai config con chatbot này, env không ăn ạ =]]]] Chúc may mắn người đọc đoạn code này lần sau 
import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPage } from 'next'

/**
 * Index page - chỉ xử lý redirect dựa vào query param 'mode'
 * Reload ở trang nào thì vẫn ở trang đó (Next.js tự động handle)
 */
const IndexPage: NextPage = () => {
    const router = useRouter()

    useEffect(() => {
        if (!router.isReady) return

        const { mode } = router.query

        // Redirect dựa vào query param 'mode'
        if (mode === 'quan-tri') {
            router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
        } else if (mode === 'tro-ly-ao') {
            router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
        } else {
            // Mặc định redirect về chatbot nếu vào root path
            router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
        }
    }, [router.isReady, router.query.mode, router])

    return <Loading />
}

export default IndexPage
