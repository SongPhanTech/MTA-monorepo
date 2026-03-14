import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

declare module 'hono' {
    interface ContextVariableMap {
        user: {
            userName: string
            fullName: string
            sub: string
            id: string
            organizationUnitId?: string | null
        }
    }
}

export const jwtAuth = (appCode: string): MiddlewareHandler => {
    return async (c, next) => {
        console.log(`[jwtAuth] Checking authentication for appCode: ${appCode}`)

        const headerToken = c.req.header('Authorization')?.split(' ')[1]
        const token = headerToken || getCookie(c, `x-token-${appCode}`)

        const reqCookie = c.req.header('Cookie') || ''

        if (!token) {
            return c.text('Unauthorized: No token provided', 401)
        }
        const cookie = headerToken ? `x-tenantcode=dev; x-token-${appCode}=${token}` : reqCookie
        try {
            const response = await fetch(
                `${process.env.SYSTEM_BASE_URL}/api/system/share/users/user-info`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Cookie: cookie,
                        'K-AppCode': appCode,
                        'K-TenantCode': 'dev',
                    },
                }
            )
            const data = await response.json()
            const sessionData = data.Data
            // Attach user info to context
            c.set('user', {
                userName: sessionData.preferred_username,
                fullName: sessionData.name,
                sub: sessionData.sDM_NhanVienId,
                id: sessionData.sDM_NhanVienId,
                organizationUnitId: sessionData.sDM_DonViId,
            })
            await next()
        } catch (err) {
            console.error('JWT verification failed:', err)
            return c.text('Unauthorized: Invalid token', 401)
        }
    }
}
