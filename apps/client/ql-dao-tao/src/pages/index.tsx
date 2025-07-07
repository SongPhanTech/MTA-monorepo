import Loading from '@components/commons/loading'
import { useSession } from '@workspace/auth/react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage: NextPage = () => {
    // const menus = useMenuList()
    const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        console.log('status', status)

        router.push('/home')
        // if (status === 'authenticated') {
        //     router.push('/home')
        // if (goToLastPage()) return
        // const firstMenu = menus.flat()
        // if (firstMenu.length > 0 && firstMenu[0].path) {
        //     router.push(firstMenu[0].path)
        // }
        // }
    }, [router.push, status])
    return <Loading />
}
export default IndexPage
