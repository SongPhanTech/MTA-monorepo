import type { PrismaClient } from '@workspace/db'
import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Session } from '..'

export const jwtAuth = (
    jwksUri: string,
    audience: string,
    issuer: string,
    prisma: PrismaClient
): MiddlewareHandler => {
    const JWKS = createRemoteJWKSet(new URL(jwksUri))
    return async (c, next) => {
        const token = getCookie(c, 'x-token')
        console.log('[jwtAuth].getJwtFromRequest', token)
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
            const existedUser = await prisma.user.findFirst({
                where: {
                    id: payload.sDM_NhanVienId,
                },
            })
            if (!existedUser) {
                // Create user if not exists
                await prisma.user.create({
                    data: {
                        id: payload.sDM_NhanVienId,
                        userName: payload.preferred_username || payload.name,
                        email: payload.email,
                        name: payload.name,
                        ssoId: payload.sub,
                    },
                })
            }
            await next()
        } catch (err) {
            console.error('JWT verification failed:', err)
            return c.text('Unauthorized: Invalid token', 401)
        }
    }
}
