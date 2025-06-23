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
            fetchSession().then((result) => {
                setSessionState(result.data)
                setStatus(result.status)
            })
        }
    }, [status])

    return {
        status,
        data: sessionState,
    }
}
