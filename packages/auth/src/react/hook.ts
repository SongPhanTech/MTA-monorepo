import { useContext, useEffect } from 'react'
import { fetchSession } from '.'
import { SessionContext } from './provider'

export const useSession = () => {
    const { sessionState, setSessionState, setStatus, status } =
        useContext(SessionContext)
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (status === 'loading') return
        if (!status) {
            setStatus('loading')
            fetchSession()
                .then((result) => {
                    setSessionState(result.data)
                    setStatus('authenticated')
                })
                .catch((error) => {
                    console.error('Failed to fetch session:', error)
                    setSessionState(null)
                    setStatus('unauthenticated')
                })
        }
    }, [status])

    return {
        status,
        data: sessionState,
    }
}
