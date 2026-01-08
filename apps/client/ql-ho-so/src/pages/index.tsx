import Loading from '@components/commons/loading'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage = () => {
    // const { status } = useSession()
    // const router = useRouter()

    // useEffect(() => {
    //     if (status === 'authenticated') {
    //         // const flatMenu = menus.flat()

    //         // const firstMenu = flatMenu.find((i) => i.path)
    //         // if (firstMenu?.path) {
    //         //     router.push(firstMenu.path)
    //         // }
    //         router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME)
    //     }
    // }, [status, router.push])
    // return <Loading />

    const router = useRouter()

    useEffect(() => {
        router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME)
    }, [router.push])
    return <Loading />
}
export default IndexPage
