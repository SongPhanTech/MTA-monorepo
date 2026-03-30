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
  if (!xToken) {
    return null
  }
  const issuer = process.env.AUTH_ISSUER
  if (!issuer) {
    throw new Error("AUTH_ISSUER environment variable is not set")
  }
  const response = await fetch(`${issuer}/authsso/me`, {
    headers: {
      Cookie: cookie,
      "K-AppCode": appCode,
      "K-TenantCode": tenantCode,
    },
  })

  if (!response.ok) {
    console.log("[auth] response", response)
    return null
  }

  const isAuthenticated = await response.json()
  console.log("isAuthenticated", isAuthenticated)
  if (!isAuthenticated) {
    throw new Error("User is not authenticated")
  }
  return {
    // ...(jwtDecode(xToken) as Session),
    ...(({ accessToken, accessTokenWs, ...rest }) => rest)(isAuthenticated),
    sDM_DonViId: isAuthenticated?.organizationId,
    sDM_NhanVienId: isAuthenticated?.userId,
  } as Session
}

export { auth }
