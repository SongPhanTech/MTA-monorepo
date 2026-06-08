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
import { getRuntimeEnv } from "@workspace/libs/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useEffect } from "react"

const IndexPage = () => {
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip router?.asPath>
  useEffect(() => {
    router.push(
      window.location.pathname !== getRuntimeEnv("NEXT_PUBLIC_BASE_PATH")
        ? router?.asPath.replace(/\?token=[^&]*/, "")
        : ROUTER_PATH.QL_DAO_TAO.HOME
    )
  }, [router.push])

  return <Loading />
}
export default IndexPage
