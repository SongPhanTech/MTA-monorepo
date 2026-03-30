import Loading from "@components/commons/loading"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { useRouter } from "next/router"
import { useEffect } from "react"

const IndexPage = () => {
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip router?.asPath>
  useEffect(() => {
    router.push(
      window.location.pathname !== getRuntimeEnv("NEXT_PUBLIC_BASE_PATH")
        ? router?.asPath.replace(/\?token=[^&]*/, "")
        : "/home"
    )
  }, [router.push])
  return <Loading />
}
export default IndexPage
