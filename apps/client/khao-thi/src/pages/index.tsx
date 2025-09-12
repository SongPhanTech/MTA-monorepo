import Loading from '@components/commons/loading'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage: NextPage = () => {
    const router = useRouter()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        console.log('IndexPage', router)
        if (router.asPath === '/') {
            router.push('/home')
            return
        }
        router.push(router.asPath)
    }, [])
    return <Loading />
}
export default IndexPage
