const encoder = new TextEncoder()

const toBase64Url = (data: string | ArrayBuffer) => {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data)
  return buf.toString("base64url")
}

export const getOnlyOfficeJwtSecret = () =>
  process.env.ONLYOFFICE_JWT_SECRET?.trim() || "swantechKeyOnlyOffice38912wnsaiwe"

export const getOnlyOfficeJwtHeader = () =>
  process.env.ONLYOFFICE_JWT_HEADER?.trim() || "AuthorizationJwt"

/** HS256 JWT for OnlyOffice Document Server (config editor / converter body). */
export async function signOnlyOfficeJwt(payload: Record<string, unknown>): Promise<string | null> {
  const secret = getOnlyOfficeJwtSecret()
  if (!secret) return null

  const now = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: now,
    exp: now + 60 * 60,
  }

  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const data = `${header}.${toBase64Url(JSON.stringify(body))}`
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return `${data}.${toBase64Url(sig)}`
}

export async function onlyOfficeAuthHeaders(
  payload: Record<string, unknown>
): Promise<Record<string, string>> {
  const token = await signOnlyOfficeJwt(payload)
  if (!token) return {}
  return { [getOnlyOfficeJwtHeader()]: `Bearer ${token}` }
}
