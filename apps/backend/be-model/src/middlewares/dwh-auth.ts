import { timingSafeEqual } from "node:crypto"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { dwhConfig } from "../dwh/config"

const safeEqual = (actual: string | undefined, expected: string) => {
  if (!actual || !expected) return false
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

/** Trục gọi vào MTA bằng x-clientid/x-clientsecret = Client Id/Secret của ứng dụng MTA trên MTA-SSO. */
export const hasValidDwhClient = (header: (name: string) => string | undefined) =>
  safeEqual(header("x-clientid"), dwhConfig.clientId) &&
  safeEqual(header("x-clientsecret"), dwhConfig.clientSecret)

export const dwhAuth = createMiddleware(async (c, next) => {
  if (!hasValidDwhClient((name) => c.req.header(name))) {
    throw new HTTPException(401, { message: "Invalid credentials" })
  }
  await next()
})
