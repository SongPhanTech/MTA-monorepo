import Loading from "@components/commons/loading"
import { useMenuList } from "@hooks/menu-list"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

const IndexPage = () => {
  const menus = useMenuList()
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== "authenticated") return

    const asPath = router.asPath.split("?")[0]
    const isIndex = router.pathname === "/" || router.pathname === "/index"
    if (!isIndex) return

    if (asPath && asPath !== "/" && asPath !== "/index") {
      void router.replace(asPath)
      return
    }

    const firstMenu = menus.flat().find((i) => i.path)
    if (firstMenu?.path) {
      void router.push(firstMenu.path)
    }
  }, [status, menus, router])

  return <Loading />
}
export default IndexPage

IndexPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
