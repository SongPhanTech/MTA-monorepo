import Loading from "@components/commons/loading"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"

/**
 * Trang index xử lý routing gốc và reload với `output: "export"`.
 *
 * Khi reload URL sâu (vd: /lct/quan-ly-lich/lich-tuan), web server có thể
 * fallback về index.html → component này được render và chuyển về đúng route.
 */
const IndexPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const basePath = (getRuntimeEnv("NEXT_PUBLIC_BASE_PATH") || "").replace(/\/+$/, "")
    const browserPath = window.location.pathname.replace(/\/+$/, "") || "/"
    const isAppRoot =
      browserPath === "/" ||
      browserPath === basePath ||
      router.asPath === "/" ||
      router.asPath === ""

    if (isAppRoot) {
      router.replace(ROUTER_PATH.QL_LICH_CONG_TAC.TONG_QUAN)
      return
    }

    router.replace(router.asPath.replace(/\?token=[^&]*/, ""))
  }, [router.asPath, router.isReady, router.replace])

  return <Loading />
}

export default IndexPage
