import Loading from '@components/commons/loading'
// import { useMenuList } from '@hooks/menu-list'
import type { NextPage } from 'next'

const IndexPage: NextPage = () => {
    // const menus = useMenuList()
    // const { status } = useSession()

    // useEffect(() => {
    //     console.log(111)

    //     // if (status === 'authenticated') {
    //     window.location.href = '/lms/home'

    //     // if (goToLastPage()) return
    //     // const firstMenu = menus.flat()
    //     // if (firstMenu.length > 0 && firstMenu[0].path) {
    //     //     window.location.href = firstMenu[0].path
    //     // }
    //     // }
    // }, [])
    return <Loading />
}
export default IndexPage
