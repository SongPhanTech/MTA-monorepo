import type { Session, SessionStatus } from '..'
import { useSession } from './hook'
import SessionProvider from './provider'
const signIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_ISSUER}/authsso/signin`
}
const fetchSession = async (): Promise<{
    status: SessionStatus
    data: Session | null
    error: Error | null
}> => {
    try {
        const response = await fetch('/api/sso', {
            method: 'GET',
            credentials: 'include',
        })
        if (!response.ok) {
            throw new Error('Failed to fetch session')
        }
        const sessionData = await response.json()
        return {
            status: 'authenticated',
            data: sessionData,
            error: null,
        }
    } catch (error) {
        signIn()
        return {
            status: 'unauthenticated',
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error'),
        }
    }
}
const signOut = async () => {}

const getSession = async () => {
    return (await fetchSession()).data
}

export {
    signIn,
    signOut,
    getSession,
    fetchSession,
    useSession,
    SessionProvider,
}
