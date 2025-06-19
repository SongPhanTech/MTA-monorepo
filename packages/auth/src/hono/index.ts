import type { Context, MiddlewareHandler } from 'hono'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import type { Session } from '..'

const getJwtFromRequest = (c: Context): string | null => {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }
    return null
}

export const jwtAuth = (
    jwksUri: string,
    audience: string,
    issuer: string
): MiddlewareHandler => {
    const JWKS = createRemoteJWKSet(new URL(jwksUri))

    return async (c, next) => {
        const token = getJwtFromRequest(c)
        if (!token) {
            return c.text('Unauthorized: No token provided', 401)
        }
        try {
            const { payload } = await jwtVerify<Session>(token, JWKS, {
                issuer,
                audience,
            })
            // Attach user info to context
            c.set('user', {
                userName: payload.preferred_username || payload.name,
                fullName: payload.name,
                sessionId: payload.sid,
                ssoId: payload.sub,
                id: payload.sDM_NhanVienId,
                organizationUnitId: payload.sDM_DonViId,
            })
            await next()
        } catch (err) {
            console.error('JWT verification failed:', err)
            return c.text('Unauthorized: Invalid token', 401)
        }
    }
}
