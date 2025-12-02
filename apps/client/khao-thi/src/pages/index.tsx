import Loading from '@components/commons/loading'
// import { useMenuList } from '@hooks/menu-list'
// import { useSession } from '@workspace/auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
// import { useEffect } from 'react'

const IndexPage = () => {
    // const menus = useMenuList()
    // const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        console.log(router)
        router.push(router?.asPath !== '/' ? router?.asPath : '/home')
        // const firstMenu = menus.flat()
        // if (firstMenu.length > 0 && firstMenu[0].path) {
        //         router.push(firstMenu[0].path)
        //     }
    }, [router.push])
    return <Loading />
}
export default IndexPage
