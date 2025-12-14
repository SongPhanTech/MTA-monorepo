import Loading from '@components/commons/loading'
import { useSession } from '@workspace/auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'

const IndexPage = () => {
    const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            // const flatMenu = menus.flat()

            // const firstMenu = flatMenu.find((i) => i.path)
            // if (firstMenu?.path) {
            //     router.push(firstMenu.path)
            // }
            router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME)
        }
    }, [status, router.push])
    return <Loading />
}
export default IndexPage

IndexPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
