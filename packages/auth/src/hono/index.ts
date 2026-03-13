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
        const token = getCookie(c, `x-token-${appCode}`)

        const env = process.env.ENVI_1 || 'production'
        console.log(`[jwtAuth] Retrieved environment : ${env}`)
        const tokenGialap = process.env.TOKEN_GIALAP
        console.log(`[jwtAuth] Retrieved token: ${token}, env: ${env}, tokenGialap: ${tokenGialap}`)

        const isDevelopEnv = env === 'develop' || env === 'development'
        const tokenToUse = token || (isDevelopEnv ? tokenGialap : undefined)
        const cookie = c.req.header('Cookie') || ''
        const cookieWithToken =
            isDevelopEnv && tokenGialap
                ? `${cookie}${cookie ? '; ' : ''}x-token-${appCode}=${tokenGialap}`
                : cookie

        if (!tokenToUse) {
            return c.text('Unauthorized: No token provided', 401)
        }
        try {
            const response = await fetch(
                'https://mta.swantech.vn/api/system/share/users/user-info',
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Cookie: appCode === "lms" ? cookieWithToken : cookie,
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
