import Loading from "@components/commons/loading"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"

const CongGiangVienIndexPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN)
  }, [router])

  return <Loading />
}

export default CongGiangVienIndexPage
