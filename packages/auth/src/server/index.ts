import type { Session } from ".."

const auth = async ({
  xToken,
  appCode,
  tenantCode,
  cookie,
}: {
  xToken: string
  appCode: string
  tenantCode: string
  cookie: string
}): Promise<Session | null> => {
  console.log("[auth] ========== SSO REQUEST ==========")
  console.log("[auth] appCode:", appCode)
  console.log("[auth] tenantCode:", tenantCode)
  console.log("[auth] xToken:", xToken)
  console.log("[auth] cookie:", cookie)

  if (!xToken) {
    console.log("[auth] aborted: xToken is empty")
    return null
  }

  const issuer = process.env.AUTH_ISSUER
  if (!issuer) {
    throw new Error("AUTH_ISSUER environment variable is not set")
  }

  const ssoUrl = `${issuer}/authsso/me`
  const ssoHeaders = {
    Cookie: cookie,
    "K-AppCode": appCode,
    "K-TenantCode": tenantCode,
  }

  console.log("[auth] AUTH_ISSUER:", issuer)
  console.log("[auth] SSO URL:", ssoUrl)
  console.log("[auth] SSO headers:", JSON.stringify(ssoHeaders, null, 2))

  const response = await fetch(ssoUrl, { headers: ssoHeaders })

  console.log("[auth] ========== SSO RESPONSE ==========")
  console.log("[auth] status:", response.status, response.statusText)

  const responseText = await response.text()
  console.log("[auth] body (raw):", responseText)

  if (!response.ok) {
    console.log("[auth] SSO call failed")
    return null
  }

  let isAuthenticated: Record<string, unknown>
  try {
    isAuthenticated = JSON.parse(responseText) as Record<string, unknown>
  } catch (error) {
    console.log("[auth] failed to parse SSO JSON:", error)
    return null
  }

  console.log("[auth] body (parsed):", JSON.stringify(isAuthenticated, null, 2))

  if (!isAuthenticated) {
    console.log("[auth] isAuthenticated is falsy")
    throw new Error("User is not authenticated")
  }

  const session = {
    ...(({ accessToken, accessTokenWs, ...rest }) => rest)(isAuthenticated),
    sDM_DonViId: isAuthenticated?.organizationId,
    sDM_NhanVienId: isAuthenticated?.userId,
  } as Session

  console.log("[auth] ========== SESSION MAPPED ==========")
  console.log("[auth] session:", JSON.stringify(session, null, 2))

  return session
}

export { auth }
