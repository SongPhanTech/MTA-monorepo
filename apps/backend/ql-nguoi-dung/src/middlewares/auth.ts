import {
    type OidcClaimsHook,
    getAuth,
    oidcAuthMiddleware,
    processOAuthCallback,
    revokeSession,
} from '@hono/oidc-auth'
import type { OpenAPIHono } from '@hono/zod-openapi'
import type { OidcAuthClaims } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'

declare module 'hono' {
    interface ContextVariableMap {
        user: Awaited<ReturnType<typeof getUser>>
    }

    interface OidcAuthClaims {
        sub: string
        given_name: string
        email: string
        username: string
    }
}

export const getUser = async (info: OidcAuthClaims) => {
    return prisma.user.upsert({
        where: { ssoId: info.sub },
        create: {
            ssoId: info.sub,
            email: info.email,
            name: info.given_name,
            userName: info.username,
        },
        update: {
            email: info.email,
            name: info.given_name,
            userName: info.username,
        },
        include: {
            groups: {
                include: { roles: true },
            },
        },
    })
}

export const getUserByToken = async (token: string) => {
    const res = await fetch(`${process.env.OIDC_BASE_URL}/oauth2/userinfo`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
        throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const data: OidcAuthClaims = await res.json()
    return getUser(data)
}

const oidcClaimsHook: OidcClaimsHook = async (orig, claims, response) => {
    return {
        sub: claims?.sub || orig?.sub || '',
        email: (claims?.email as string) || orig?.email || '',
        given_name: (claims?.given_name as string) || '',
        username: (claims?.username as string) || '',
    }
}

export const setupAuth = (app: OpenAPIHono) => {
    app.use('*', async (c, next) => {
        const token = c.req.header('Authorization')?.split('Bearer ')[1]
        if (token) {
            const user = await getUserByToken(token)

            c.set('user', user)
            return await next()
        }

        // throw new HTTPException(401, { message: 'Unauthorized' })

        c.set('oidcClaimsHook', oidcClaimsHook)
        const auth = await getAuth(c)
        if (auth) {
            const user = await getUser(auth)

            c.set('user', user)
            return next()
        }

        const middleware = oidcAuthMiddleware()
        return middleware(c, next)
    })

    app.get('/callback', processOAuthCallback)

    app.get('/', async (c) => {
        const user = c.get('user')
        return c.json(user, 200)
    })

    app.get('/logout', async (c) => {
        await revokeSession(c)
        return c.text('You have been successfully logged out!')
    })
}
