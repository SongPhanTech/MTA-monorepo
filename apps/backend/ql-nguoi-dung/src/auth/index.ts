import {
    type OidcClaimsHook,
    getAuth,
    oidcAuthMiddleware,
    processOAuthCallback,
    revokeSession,
} from '@hono/oidc-auth'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '..'

declare module 'hono' {
    interface ContextVariableMap {
        user: Awaited<ReturnType<typeof getUser>>
    }

    interface OidcAuthClaims {
        email: string
        sub: string
    }
}

export const getUser = async (ssoId: string) => {
    return prisma.user.findFirstOrThrow({
        where: { ssoId },
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
    const data = await res.json()
    if (!data?.sub) {
        throw new HTTPException(401, { message: 'Unauthorized' })
    }
    return getUser(data.sub)
}

const oidcClaimsHook: OidcClaimsHook = async (orig, claims, response) => {
    console.log(111, response)

    return {
        sub: claims?.sub || orig?.sub || '',
        email: (claims?.email as string) || orig?.email || '',
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

        // c.set('oidcClaimsHook', oidcClaimsHook)
        const auth = await getAuth(c)
        if (auth) {
            const user = await getUser(auth.sub)
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
