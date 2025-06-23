import { jwtDecode } from 'jwt-decode'
import { type NextRequest, NextResponse } from 'next/server'
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
        headers: {
            cookie: `x-token=${token}`,
        },
    })
    if (!response.ok) {
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

const GET = async (request: NextRequest) => {
    const token = request.cookies.get('x-token')?.value
    const session = await auth(token)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(session)
}

export { auth, GET }
