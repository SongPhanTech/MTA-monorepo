import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import type { Session, SessionStatus } from '..'

const SessionContext = React.createContext<{
    session: any | null | undefined
    sessionState: Session | null
    status: SessionStatus | null
    setSessionState: React.Dispatch<React.SetStateAction<Session | null>>
    setStatus: React.Dispatch<React.SetStateAction<SessionStatus | null>>
}>({
    session: null,
    sessionState: null,
    status: null,
    setSessionState: () => {},
    setStatus: () => {},
})

const SessionProvider: React.FC<{
    children: React.ReactNode
    session?: any | null | undefined
}> = ({ children, session }) => {
    const [sessionState, setSessionState] = React.useState<Session | null>(
        session
    )
    const [status, setStatus] = React.useState<SessionStatus | null>(null)
    const router = useRouter()
    useEffect(() => {
        if (router.pathname !== '/') {
            localStorage.setItem('lastPage', router.pathname)
        }
    }, [router.pathname])

    return (
        <SessionContext.Provider
            value={{
                session,
                sessionState,
                status,
                setSessionState,
                setStatus,
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}

export default SessionProvider

export { SessionProvider, SessionContext }
