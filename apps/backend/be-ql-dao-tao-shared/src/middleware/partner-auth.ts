import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

export type PartnerJwtClaims = JWTPayload & {
  scope?: string
  azp?: string
  client_id?: string
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
}

type PartnerAuthVariables = {
  partnerJwt: PartnerJwtClaims
  partnerClientId: string
  partnerScopes: Set<string>
}

declare module "hono" {
  interface ContextVariableMap extends PartnerAuthVariables {}
}

const AUTH_DISABLED = process.env.SHARED_API_AUTH_DISABLED === "true"

/**
 * Issuer trong JWT Keycloak online hiện là:
 *   http://mta.edu.vn:9080/iam/realms/mta
 * (không phải https://mta.edu.vn/iam/...).
 * Có thể override bằng KEYCLOAK_ISSUER (csv) hoặc KEYCLOAK_URL+REALM.
 */
function allowedIssuers(): string[] {
  const explicit = (process.env.KEYCLOAK_ISSUER || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean)
  if (explicit.length) return explicit

  const url = (process.env.KEYCLOAK_URL || "").replace(/\/$/, "")
  const realm = process.env.KEYCLOAK_REALM || ""
  if (!url || !realm) return []
  return [`${url}/realms/${realm}`]
}

/** JWKS URL — nên trỏ URL nội bộ (vd http://172.17.0.1:9080/...) tránh WAF HTML trên https public. */
function jwksUrl(issuers: string[]): string | null {
  const override = process.env.KEYCLOAK_JWKS_URL?.trim()
  if (override) return override
  const issuer = issuers[0]
  return issuer ? `${issuer}/protocol/openid-connect/certs` : null
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
let jwksLoadedFor: string | null = null

function getJwks(url: string) {
  if (!jwks || jwksLoadedFor !== url) {
    jwks = createRemoteJWKSet(new URL(url))
    jwksLoadedFor = url
  }
  return jwks
}

function parseScopes(payload: PartnerJwtClaims): Set<string> {
  const scopes = new Set<string>()
  if (typeof payload.scope === "string") {
    for (const s of payload.scope.split(/\s+/)) {
      if (s) scopes.add(s)
    }
  }
  for (const r of payload.realm_access?.roles ?? []) scopes.add(r)
  return scopes
}

function allowedClients(): Set<string> {
  const raw = process.env.SHARED_API_ALLOWED_CLIENTS || ""
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

/** Map path → scope bắt buộc. */
export function requiredScopeForPath(path: string): string | null {
  if (path.startsWith("/v1/subjects")) return "read:subjects"
  if (path.startsWith("/v1/subject-classes")) return "read:subject-classes"
  if (path.startsWith("/v1/lecturers")) return "read:lecturers"
  if (path.startsWith("/v1/students")) return "read:student-scores"
  return null
}

export const partnerJwtAuth: MiddlewareHandler = createMiddleware(async (c, next) => {
  if (AUTH_DISABLED) {
    c.set("partnerJwt", { sub: "auth-disabled" })
    c.set("partnerClientId", "auth-disabled")
    c.set(
      "partnerScopes",
      new Set([
        "read:subjects",
        "read:subject-classes",
        "read:lecturers",
        "read:student-scores",
      ])
    )
    await next()
    return
  }

  const issuers = allowedIssuers()
  const certsUrl = jwksUrl(issuers)
  if (!issuers.length || !certsUrl) {
    throw new HTTPException(500, {
      message: "KEYCLOAK_ISSUER hoặc KEYCLOAK_URL/KEYCLOAK_REALM chưa cấu hình",
    })
  }

  const header = c.req.header("authorization") || c.req.header("Authorization") || ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) {
    throw new HTTPException(401, { message: "Thiếu Authorization Bearer token" })
  }

  let payload: PartnerJwtClaims
  try {
    const audience = process.env.SHARED_API_TOKEN_AUDIENCE?.trim()
    const verified = await jwtVerify(match[1], getJwks(certsUrl), {
      issuer: issuers.length === 1 ? issuers[0] : issuers,
      ...(audience ? { audience } : {}),
    })
    payload = verified.payload as PartnerJwtClaims
  } catch (err) {
    console.warn("[partner-auth] JWT verify failed", err)
    throw new HTTPException(401, { message: "Access token không hợp lệ hoặc hết hạn" })
  }

  const clientId = String(payload.azp || payload.client_id || "")
  const allowed = allowedClients()
  if (allowed.size && clientId && !allowed.has(clientId)) {
    throw new HTTPException(403, { message: `Client ${clientId} không được phép` })
  }

  const scopes = parseScopes(payload)
  const needed = requiredScopeForPath(c.req.path)
  if (needed && !scopes.has(needed)) {
    throw new HTTPException(403, {
      message: `Thiếu scope/role bắt buộc: ${needed}`,
    })
  }

  c.set("partnerJwt", payload)
  c.set("partnerClientId", clientId || "unknown")
  c.set("partnerScopes", scopes)
  await next()
})
