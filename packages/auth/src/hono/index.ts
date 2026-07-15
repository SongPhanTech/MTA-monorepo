import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"

declare module "hono" {
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

const layMockUser = () => {
  const profileId = process.env.MOCK_USER_PROFILE_ID?.trim()
  if (!profileId || process.env.NODE_ENV === "production") {
    return null
  }

  return {
    userName: process.env.MOCK_USER_NAME?.trim() || "local-dev",
    fullName: process.env.MOCK_USER_FULL_NAME?.trim() || "Local Dev",
    sub: profileId,
    id: profileId,
    organizationUnitId: process.env.MOCK_ORGANIZATION_ID?.trim() || null,
  }
}

export const jwtAuth = (appCode: string): MiddlewareHandler => {
  return async (c, next) => {
    console.log(`[jwtAuth] Checking authentication for appCode: ${appCode}`)

    const mockUser = layMockUser()
    if (mockUser) {
      console.log(`[jwtAuth] Using mock user: ${mockUser.fullName} (${mockUser.id})`)
      c.set("user", mockUser)
      await next()
      return
    }

    const headerToken = c.req.header("Authorization")?.split(" ")[1]
    const token = headerToken || getCookie(c, `x-token-${appCode}`)

    const reqCookie = c.req.header("Cookie") || ""

    if (!token) {
      return c.text("Unauthorized: No token provided", 401)
    }
    const cookie = headerToken ? `x-tenantcode=dev; x-token-${appCode}=${token}` : reqCookie
    try {
      const response = await fetch(
        `${process.env.SYSTEM_BASE_URL}/api/system/share/users/user-info`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Cookie: cookie,
            "K-AppCode": appCode,
            "K-TenantCode": "dev",
          },
        }
      )
      const data = await response.json()
      const sessionData = data.Data
      // Attach user info to context
      c.set("user", {
        userName: sessionData.preferred_username,
        fullName: sessionData.name,
        sub: sessionData.sDM_NhanVienId,
        id: sessionData.sDM_NhanVienId,
        organizationUnitId: sessionData.sDM_DonViId,
      })
      await next()
    } catch (err) {
      console.error("JWT verification failed:", err)
      return c.text("Unauthorized: Invalid token", 401)
    }
  }
}
