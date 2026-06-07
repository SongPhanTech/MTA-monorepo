// import Loading from '@components/commons/loading'
// import { useMenuList } from '@hooks/menu-list'
// import DefaultLayout from '@layouts/default-layout'
// import { useSession } from '@workspace/auth/react'
// import { useRouter } from 'next/router'
// import { useEffect } from 'react'

// const IndexPage = () => {
//     const menus = useMenuList()
//     const { status } = useSession()
//     const router = useRouter()

//     useEffect(() => {
//         if (status === 'authenticated') {
//             const flatMenu = menus.flat()

//             const firstMenu = flatMenu.find((i) => i.path)
//             if (firstMenu?.path) {
//                 router.push(firstMenu.path)
//             }
//         }
//     }, [status, menus, router.push])
//     return <Loading />
// }
// export default IndexPage

// IndexPage.getLayout = function getLayout(page: React.ReactElement) {
//     return <DefaultLayout>{page}</DefaultLayout>
// }
import Loading from "@components/commons/loading"
import { useGiangVien } from "@hooks/use-giang-vien"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { setLayoutMode, useLayoutMode } from "@/stores/layout-mode"

const IndexPage = () => {
  const router = useRouter()
  const { isGiangVien, isLoading } = useGiangVien()
  const mode = useLayoutMode()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip router?.asPath>
  useEffect(() => {
    if (isLoading) return

    if (window.location.pathname !== getRuntimeEnv("NEXT_PUBLIC_BASE_PATH")) {
      router.push(router?.asPath.replace(/\?token=[^&]*/, ""))
      return
    }

    if (isGiangVien && mode !== "quan-tri") {
      setLayoutMode("giang-vien")
      router.push(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN)
      return
    }

    router.push(ROUTER_PATH.QL_DAO_TAO.HOME)
  }, [isLoading, isGiangVien, mode, router.push])

  return <Loading />
}
export default IndexPage
