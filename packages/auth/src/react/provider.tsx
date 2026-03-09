import { usePathname, useSearchParams } from 'next/navigation'
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
    const [sessionState, setSessionState] = React.useState<Session | null>(session)
    const [status, setStatus] = React.useState<SessionStatus | null>(null)
    const pathname = usePathname()
    const searchParams = useSearchParams() ?? ''
    useEffect(() => {
        const url = `${pathname}${!searchParams.toString() ? '' : `?${searchParams.toString()}`}`
        if (pathname !== '/') {
            localStorage.setItem('lastSubsystem', window.location.pathname)
            localStorage.setItem('lastPage', url)
        }
    }, [pathname, searchParams])
    // console.log('SessionProvider rendered with session:', sessionState, 'and status:', status)
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
