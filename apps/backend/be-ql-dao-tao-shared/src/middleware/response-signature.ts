import { createPrivateKey, sign } from "node:crypto"
import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"

let privateKey: ReturnType<typeof createPrivateKey> | null | undefined

function loadPrivateKey() {
  if (privateKey !== undefined) return privateKey
  const pem = process.env.SHARED_API_SIGNING_PRIVATE_KEY?.replace(/\\n/g, "\n")?.trim()
  if (!pem) {
    privateKey = null
    return null
  }
  try {
    privateKey = createPrivateKey(pem)
    return privateKey
  } catch (e) {
    console.warn("[response-signature] invalid SHARED_API_SIGNING_PRIVATE_KEY", e)
    privateKey = null
    return null
  }
}

/** Ký body JSON response → header X-Signature (base64 RSA-SHA256). */
export const responseSignature: MiddlewareHandler = createMiddleware(async (c, next) => {
  await next()

  const key = loadPrivateKey()
  if (!key) return

  try {
    const body = await c.res.clone().text()
    const signature = sign("sha256", Buffer.from(body, "utf8"), key).toString("base64")
    const headers = new Headers(c.res.headers)
    headers.set("X-Signature", signature)
    headers.set("X-Signature-Alg", "RSA-SHA256")
    c.res = new Response(c.res.body, {
      status: c.res.status,
      statusText: c.res.statusText,
      headers,
    })
  } catch (e) {
    console.warn("[response-signature] sign failed", e)
  }
})
