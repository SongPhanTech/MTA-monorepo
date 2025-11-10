import Loading from '@components/commons/loading'
import { useSession } from '@workspace/auth/react'
import { ROUTER_PATH } from '@workspace/router'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage: NextPage = () => {
    const { status, goToLastPage } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            if (goToLastPage('dangkyhoc')) return
            router.push(ROUTER_PATH.DANG_KY_HOC.HOME)
        }
    }, [status, router.push, goToLastPage])
    return <Loading />
}
export default IndexPage
