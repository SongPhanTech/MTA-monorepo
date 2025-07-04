import { useContext, useEffect } from 'react'
import { fetchSession } from '.'
import { SessionContext } from './provider'

export const useSession = () => {
    const { sessionState, setSessionState, setStatus, status } = useContext(SessionContext)
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (status === 'loading') return
        if (!status) {
            setStatus('loading')
            fetchSession().then((result) => {
                console.log('result', result)
                setSessionState(result.data)
                setStatus(result.status)
            })
        }
    }, [])

    // const goToLastPage = useCallback(() => {
    //     const lastPage = localStorage.getItem('lastPage')
    //     if (lastPage && lastPage !== '/') {
    //         window.location.href = lastPage
    //         return true
    //     }
    //     return false
    // }, [])

    return {
        status,
        data: sessionState,
        // goToLastPage,
    }
}
