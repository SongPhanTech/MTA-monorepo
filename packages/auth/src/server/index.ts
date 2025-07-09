import { jwtDecode } from 'jwt-decode'
import type { Session } from '..'

const auth = async (token?: string): Promise<Session | null> => {
    if (!token) {
        return null
    }
    const issuer = process.env.AUTH_ISSUER
    if (!issuer) {
        throw new Error('AUTH_ISSUER environment variable is not set')
    }
    const response = await fetch(`${issuer}/authsso/me`, {
        headers: { Cookie: `x-token=${token}` },
    })

    if (!response.ok) {
        console.log('[auth] response', response)
        return null
    }

    const isAuthenticated = await response.json()
    if (!isAuthenticated) {
        throw new Error('User is not authenticated')
    }
    return {
        ...(jwtDecode(token) as Session),
        access_token: token,
    }
}

export { auth }
