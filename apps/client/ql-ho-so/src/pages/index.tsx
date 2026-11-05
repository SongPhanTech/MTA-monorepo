import Loading from "@components/commons/loading"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"

const normalizePath = (path: string, basePath: string) => {
  const normalizedBasePath = basePath.replace(/\/+$/, "")
  if (!normalizedBasePath) return path

  const [pathname, search = ""] = path.split("?")
  const basePathPattern = new RegExp(
    `^(?:${normalizedBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})+`
  )
  const normalizedPathname = pathname.replace(basePathPattern, "") || "/"

  return `${normalizedPathname}${search ? `?${search}` : ""}`
}

const IndexPage = () => {
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip router?.asPath>
  useEffect(() => {
    const basePath = getRuntimeEnv("NEXT_PUBLIC_BASE_PATH")
    router.push(
      window.location.pathname !== basePath
        ? normalizePath(router?.asPath.replace(/\?token=[^&]*/, ""), basePath)
        : ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME
    )
  }, [router.push])

  return <Loading />
}
export default IndexPage
