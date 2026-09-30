import Loading from "@components/commons/loading"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"

const stripRepeatedBasePath = (pathname: string, basePath: string) => {
  if (!basePath) return pathname || "/"
  let rest = pathname || "/"
  while (rest === basePath || rest.startsWith(`${basePath}/`)) {
    const next = rest.slice(basePath.length) || "/"
    rest = next.startsWith("/") ? next : `/${next}`
    if (rest === "/") break
  }
  return rest || "/"
}

const IndexPage = () => {
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip router?.asPath>
  useEffect(() => {
    const basePath = (getRuntimeEnv("NEXT_PUBLIC_BASE_PATH") || "").replace(/\/$/, "")
    const { pathname, search, hash } = window.location
    const rest = stripRepeatedBasePath(pathname, basePath)
    const canonicalPathname = `${basePath}${rest === "/" ? "" : rest}`
    const duplicatedBasePath =
      !!basePath &&
      pathname !== basePath &&
      pathname !== `${basePath}/` &&
      pathname !== canonicalPathname

    if (duplicatedBasePath) {
      const appPath = rest === "/" ? ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME : rest
      const params = new URLSearchParams(search)
      params.delete("token")
      const query = params.toString()
      window.location.replace(`${basePath}${appPath}${query ? `?${query}` : ""}${hash}`)
      return
    }

    router.push(
      pathname !== basePath && pathname !== `${basePath}/`
        ? router?.asPath.replace(/\?token=[^&]*/, "")
        : ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME
    )
  }, [router.push])

  return <Loading />
}
export default IndexPage
