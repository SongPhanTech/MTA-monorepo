import type { Session, SessionStatus } from '..'
import { useSession } from './hook'
import SessionProvider from './provider'

const signIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_ISSUER}/authsso/signin?appCode=${process.env.NEXT_PUBLIC_APP_CODE}&sRedirectDefault=${process.env.NEXT_PUBLIC_APP_URL}`
}
const fetchSession = async (): Promise<{
    status: SessionStatus
    data: Session | null
    error: Error | null
}> => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_MODEL_BASE_URL}/api/auth/get-session`,
            {
                method: 'GET',
                credentials: 'include',
            }
        )
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
        // TODO!: toggle comment
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

export { signIn, signOut, getSession, fetchSession, useSession, SessionProvider }
