import type { MiddlewareHandler } from "hono"
import { getConnInfo } from "hono/bun"
import { prisma } from "../prisma"

export const checkIp: MiddlewareHandler = async (c, next) => {
  const info = getConnInfo(c)

  const blockedIp = await prisma.blockedIp.findUnique({
    where: { ipAddress: info.remote.address },
  })

  if (
    !blockedIp ||
    blockedIp.deletedAt ||
    (blockedIp.expiresAt && blockedIp.expiresAt < new Date())
  ) {
    return next()
  }

  return c.json({ message: "Your IP is blocked" }, 403)
}
