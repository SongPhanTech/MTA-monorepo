import type { MiddlewareHandler } from "hono"

export const checkIp: MiddlewareHandler = async (c, next) => {
  return next()
}
