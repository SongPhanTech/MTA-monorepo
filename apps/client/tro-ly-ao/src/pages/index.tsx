import Loading from "@components/commons/loading"
import { ROUTER_PATH } from "@workspace/router"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect } from "react"

/**
 * Index page - xử lý routing khi vào trang gốc "/"
 *
 * Với output: "export" (static HTML), khi reload trang quản trị (vd: /quan-tri/du-lieu/tai-lieu/),
 * web server có thể fallback về /index.html → component này được render.
 * Lúc đó router.asPath vẫn giữ nguyên URL gốc trên trình duyệt.
 *
 * - Nếu asPath là "/" → redirect về trang chatbot (hành vi mặc định)
 * - Nếu asPath là route khác (fallback từ server) → navigate đến đúng route đó
 *   để Next.js client-side router load đúng page component
 */
const IndexPage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const currentPath = router.asPath.split("?")[0].replace(/\/+$/, "") || "/"

    if (currentPath === "/" || currentPath === "") {
      // User thực sự truy cập trang gốc → redirect về chatbot
      router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
    } else {
      // Server fallback về index.html khi reload trang khác
      // → dùng client-side router để navigate đến đúng route gốc
      router.replace(router.asPath)
    }
  }, [router.isReady, router])

  return <Loading />
}

export default IndexPage
