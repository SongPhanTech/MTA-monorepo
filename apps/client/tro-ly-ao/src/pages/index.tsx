import Loading from "@components/commons/loading"
import { ROUTER_PATH } from "@workspace/router"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect } from "react"

/**
 * Index page - redirect về trang chatbot
 * Các trang khác (quan-tri, hoi-thoai...) đã có direct URL riêng
 * không cần query param ?mode= nữa
 */
const IndexPage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    router.replace(ROUTER_PATH.TRO_LY_AO.TRO_LY_AO)
  }, [router.isReady, router])

  return <Loading />
}

export default IndexPage
