import Loading from '@components/commons/loading'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const IndexPage = () => {
    const router = useRouter()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        router.push(router?.asPath !== '/' ? router?.asPath : '/home')
    }, [router.push])
    return <Loading />
}
export default IndexPage
