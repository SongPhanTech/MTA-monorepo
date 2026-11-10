import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"

function maskSensitive(value: string): string {
  return value
    .replace(/("?(?:phone|email|password|secret|token|authorization)"?\s*[:=]\s*")([^"]{2})[^"]*(")/gi, "$1$2***$3")
    .replace(/\b(\d{3})\d{4}(\d{3})\b/g, "$1****$2")
}

export const auditLog: MiddlewareHandler = createMiddleware(async (c, next) => {
  const started = Date.now()
  const requestId =
    c.req.header("x-request-id") ||
    c.req.header("x-correlation-id") ||
    crypto.randomUUID()

  c.header("X-Request-Id", requestId)

  await next()

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  const clientId = c.get("partnerClientId") || "-"
  const status = c.res.status

  // Ai gọi / từ đâu:
  // - client_id: OAuth client Keycloak (vd mta-shared-partner)
  // - ip: IP thật từ X-Forwarded-For / X-Real-IP (Nginx set)
  // - host: domain request (mta.edu.vn)
  // - origin / referer: domain bên gọi nếu browser gửi; server-to-server thường trống
  // - user_agent: thư viện/client gọi
  console.log(
    JSON.stringify({
      type: "shared_api_audit",
      timestamp: new Date().toISOString(),
      request_id: requestId,
      ip,
      client_id: clientId,
      host: c.req.header("host") || "-",
      origin: c.req.header("origin") || "-",
      referer: c.req.header("referer") || "-",
      user_agent: c.req.header("user-agent") || "-",
      method: c.req.method,
      path: c.req.path,
      status,
      duration_ms: Date.now() - started,
      query: maskSensitive(c.req.url.split("?")[1] || ""),
    })
  )
})
