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

const maskToken = (token?: string | null) => {
  if (!token) return "(empty)"
  if (token.length <= 12) return `${token.slice(0, 4)}…(len=${token.length})`
  return `${token.slice(0, 6)}…${token.slice(-4)}(len=${token.length})`
}

const cookieNames = (cookieHeader: string) =>
  cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean)

/** Cloudrity / WAF challenge: HTML set cookie D1N rồi reload */
const extractWafD1N = (body: string): string | null => {
  const match = body.match(/document\.cookie\s*=\s*["']D1N=([^"';]+)/i)
  return match?.[1] ?? null
}

const isWafChallengeHtml = (body: string, contentType?: string | null) => {
  const looksHtml =
    contentType?.includes("text/html") ||
    body.trimStart().startsWith("<html") ||
    body.includes("document.cookie")
  return looksHtml && (body.includes("D1N=") || body.includes("Cloudrity") || body.includes("window.location.reload"))
}

const upsertCookie = (cookieHeader: string, name: string, value: string) => {
  const parts = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !p.toLowerCase().startsWith(`${name.toLowerCase()}=`))
  parts.push(`${name}=${value}`)
  return parts.join("; ")
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const fetchUserInfo = async (
  url: string,
  appCode: string,
  cookie: string,
  opts?: { referer?: string; origin?: string }
) => {
  const headers: Record<string, string> = {
    Cookie: cookie,
    "K-AppCode": appCode,
    "K-TenantCode": "dev",
    Accept: "application/json",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent": BROWSER_UA,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }
  if (opts?.referer) headers.Referer = opts.referer
  if (opts?.origin) headers.Origin = opts.origin

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers,
  })
  const rawText = await response.text()
  const contentType = response.headers.get("content-type")
  return { response, rawText, contentType }
}

const parseUserInfoJson = (rawText: string) => {
  try {
    return rawText ? JSON.parse(rawText) : null
  } catch {
    return null
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

const normalizeAppCodes = (appCode: string | string[]) => {
  const list = (Array.isArray(appCode) ? appCode : [appCode])
    .flatMap((c) => c.split(","))
    .map((c) => c.trim())
    .filter(Boolean)
  return [...new Set(list)]
}

/**
 * Chọn appCode + token:
 * 1) Authorization Bearer → dùng K-AppCode header (nếu hợp lệ) hoặc appCode đầu
 * 2) Cookie x-token-{appCode} theo thứ tự ưu tiên
 */
const resolveAuth = (
  c: Parameters<MiddlewareHandler>[0],
  appCodes: string[]
): { appCode: string; token: string; tokenSource: string } | null => {
  const headerToken = c.req.header("Authorization")?.split(" ")[1]
  if (headerToken) {
    const headerApp = c.req.header("K-AppCode")?.trim()
    const appCode =
      headerApp && appCodes.includes(headerApp) ? headerApp : (appCodes[0] as string)
    return { appCode, token: headerToken, tokenSource: "Authorization" }
  }

  for (const code of appCodes) {
    const cookieName = `x-token-${code}`
    const token = getCookie(c, cookieName)
    if (token) {
      return { appCode: code, token, tokenSource: `cookie:${cookieName}` }
    }
  }
  return null
}

export const jwtAuth = (appCode: string | string[]): MiddlewareHandler => {
  const appCodes = normalizeAppCodes(appCode)

  return async (c, next) => {
    const path = c.req.path
    const method = c.req.method
    console.log(`[jwtAuth] ${method} ${path} | appCodes=[${appCodes.join(", ")}]`)

    const mockUser = layMockUser()
    if (mockUser) {
      console.log(`[jwtAuth] OK mock user: ${mockUser.fullName} (${mockUser.id})`)
      c.set("user", mockUser)
      await next()
      return
    }

    const reqCookie = c.req.header("Cookie") || ""
    const names = cookieNames(reqCookie)
    const resolved = resolveAuth(c, appCodes)

    console.log(
      `[jwtAuth] tokenSource=${resolved?.tokenSource ?? "none"} token=${maskToken(resolved?.token)} ` +
        `resolvedAppCode=${resolved?.appCode ?? "-"} ` +
        `hasAuthHeader=${Boolean(c.req.header("Authorization"))} cookieNames=[${names.join(", ")}]`
    )

    if (!resolved) {
      const expected = appCodes.map((code) => `x-token-${code}`).join(" | ")
      console.warn(
        `[jwtAuth] 401 No token | expected ${expected} or Authorization Bearer | ` +
          `path=${path} origin=${c.req.header("Origin") || "-"} referer=${c.req.header("Referer") || "-"}`
      )
      return c.text("Unauthorized: No token provided", 401)
    }

    const { appCode: selectedAppCode, token } = resolved
    const expectedCookie = `x-token-${selectedAppCode}`

    const systemBaseUrl = process.env.SYSTEM_BASE_URL
    if (!systemBaseUrl) {
      console.error(`[jwtAuth] 401 Invalid token | SYSTEM_BASE_URL is not set`)
      return c.text("Unauthorized: Invalid token", 401)
    }

    const userInfoUrl = `${systemBaseUrl}/api/system/share/users/user-info`
    let cookie =
      resolved.tokenSource === "Authorization"
        ? `x-tenantcode=dev; ${expectedCookie}=${token}`
        : reqCookie
    const browserLike = {
      referer: c.req.header("Referer") || `${systemBaseUrl}/`,
      origin: c.req.header("Origin") || systemBaseUrl,
    }

    try {
      console.log(`[jwtAuth] verifying via ${userInfoUrl} K-AppCode=${selectedAppCode}`)
      let { response, rawText, contentType } = await fetchUserInfo(
        userInfoUrl,
        selectedAppCode,
        cookie,
        browserLike
      )

      if (isWafChallengeHtml(rawText, contentType)) {
        const d1n = extractWafD1N(rawText)
        console.warn(
          `[jwtAuth] WAF challenge HTML from ${userInfoUrl} (Server may be Cloudrity). ` +
            `D1N=${d1n ? "present" : "missing"}. Retrying once… ` +
            `Hint: set SYSTEM_BASE_URL to internal URL (e.g. https://mta.swantech.vn) instead of public WAF domain.`
        )
        if (d1n) {
          cookie = upsertCookie(cookie, "D1N", d1n)
          ;({ response, rawText, contentType } = await fetchUserInfo(
            userInfoUrl,
            selectedAppCode,
            cookie,
            browserLike
          ))
        }
      }

      if (isWafChallengeHtml(rawText, contentType)) {
        console.error(
          `[jwtAuth] 401 WAF blocked user-info | SYSTEM_BASE_URL=${systemBaseUrl} still returns HTML challenge. ` +
            `Token is OK; change SYSTEM_BASE_URL to bypass WAF (internal/swantech). body=${rawText.slice(0, 180)}`
        )
        return c.text("Unauthorized: Invalid token", 401)
      }

      const data = parseUserInfoJson(rawText)
      if (!data) {
        console.warn(
          `[jwtAuth] user-info non-JSON body status=${response.status} contentType=${contentType} body=${rawText.slice(0, 200)}`
        )
      }

      if (!response.ok) {
        console.warn(
          `[jwtAuth] 401 Invalid token | user-info HTTP ${response.status} ` +
            `body=${rawText.slice(0, 300)}`
        )
        return c.text("Unauthorized: Invalid token", 401)
      }

      const sessionData = data?.Data
      if (!sessionData) {
        console.warn(
          `[jwtAuth] 401 Invalid token | user-info missing Data | ` +
            `keys=${data ? Object.keys(data).join(",") : "(null)"} body=${rawText.slice(0, 300)}`
        )
        return c.text("Unauthorized: Invalid token", 401)
      }

      if (!sessionData.sDM_NhanVienId) {
        console.warn(
          `[jwtAuth] 401 Invalid token | missing sDM_NhanVienId | ` +
            `preferred_username=${sessionData.preferred_username || "-"} name=${sessionData.name || "-"}`
        )
        return c.text("Unauthorized: Invalid token", 401)
      }

      c.set("user", {
        userName: sessionData.preferred_username,
        fullName: sessionData.name,
        sub: sessionData.sDM_NhanVienId,
        id: sessionData.sDM_NhanVienId,
        organizationUnitId: sessionData.sDM_DonViId,
      })
      console.log(
        `[jwtAuth] OK user=${sessionData.preferred_username} id=${sessionData.sDM_NhanVienId} ` +
          `org=${sessionData.sDM_DonViId || "-"} appCode=${selectedAppCode} path=${path}`
      )
      await next()
    } catch (err) {
      console.error(`[jwtAuth] 401 Invalid token | fetch/parse error path=${path}`, err)
      return c.text("Unauthorized: Invalid token", 401)
    }
  }
}
