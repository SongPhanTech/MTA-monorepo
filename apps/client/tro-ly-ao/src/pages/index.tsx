import Loading from "@components/commons/loading"
import { ROUTER_PATH } from "@workspace/router"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect } from "react"

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
    if (mode === "quan-tri") {
      router.replace(ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU)
    } else if (mode === "tro-ly-ao") {
      router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    } else {
      // Mặc định redirect về chatbot nếu vào root path
      router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    }
  }, [router.isReady, router.query.mode, router])

  return <Loading />
}

export default IndexPage
