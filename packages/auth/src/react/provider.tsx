import React, { useContext, useEffect, useState } from 'react'
import type { Session, SessionStatus } from '..'
import { fetchSession } from '.'
const useSession = () => {
    const { status, data, error, setStatus, setData, setError } =
        useContext(SessionContext)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setStatus('loading')
        fetchSession()
            .then((session) => {
                setStatus(session.status)
                setData(session.data)
                setError(session.error)
            })
            .catch((err) => {
                setStatus('unauthenticated')
                setData(null)
                setError(
                    err instanceof Error ? err : new Error('Unknown error')
                )
            })
    }, [])

    return {
        status,
        data,
        error,
    }
}
const SessionContext = React.createContext<{
    status: SessionStatus
    data: Session | null
    error: Error | null
    setStatus: (status: SessionStatus) => void
    setData: (data: Session | null) => void
    setError: (error: Error | null) => void
}>({
    data: null,
    status: 'loading',
    error: null,
    setData: () => {},
    setStatus: () => {},
    setError: () => {},
})

const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [status, setStatus] = useState<SessionStatus>('loading')
    const [data, setData] = useState<Session | null>(null)
    const [error, setError] = useState<Error | null>(null)
    return (
        <SessionContext.Provider
            value={{
                status,
                data,
                error,
                setStatus,
                setData,
                setError,
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}

export default SessionProvider

export { useSession, SessionProvider }
