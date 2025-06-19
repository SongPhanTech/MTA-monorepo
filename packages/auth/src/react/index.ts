import { SessionProvider, useSession } from './provider'
import type { Session, SessionStatus } from '..'
const signIn = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_ISSUER}/authsso/signin`
}
const fetchSession = async (): Promise<{
    status: SessionStatus
    data: Session | null
    error: Error | null
}> => {
    try {
        const response = await fetch('/api/auth', {
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
        return {
            status: 'unauthenticated',
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error'),
        }
    }
}
const signOut = async () => {}

const getSession = async () => {
    const session = await fetchSession()
    if (session.status === 'unauthenticated') {
        return null
    }
    return session.data
}

export {
    signIn,
    signOut,
    getSession,
    fetchSession,
    useSession,
    SessionProvider,
}
