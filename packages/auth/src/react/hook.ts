import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect } from 'react'
import { fetchSession } from '.'
import { SessionContext } from './provider'

export const useSession = () => {
    const { sessionState, setSessionState, setStatus, status } = useContext(SessionContext)
    const router = useRouter()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (status === 'loading') return
        if (!status) {
            setStatus('loading')
            fetchSession().then((result) => {
                setSessionState(result.data)
                setStatus(result.status)
            })
        }
    }, [])

    const goToLastPage = useCallback(() => {
        const lastPage = localStorage.getItem('lastPage')
        if (lastPage && lastPage !== '/') {
            router.push(lastPage)
            return true
        }
        return false
    }, [router])

    return {
        status,
        data: sessionState,
        goToLastPage,
    }
}
