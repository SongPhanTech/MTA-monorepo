import type { MiddlewareHandler } from "hono"
import { getConnInfo } from "hono/bun"
import { prisma } from ".."

const CACHE_TTL_MS = Number.parseInt(process.env.CHECK_IP_CACHE_TTL_MS || "60000", 10)
const CACHE_MAX_ENTRIES = Number.parseInt(process.env.CHECK_IP_CACHE_MAX || "5000", 10)

type CacheEntry = {
  blocked: boolean
  expiresAtMs: number
}

const cache = new Map<string, CacheEntry>()

function pruneExpired(now: number) {
  for (const [ip, entry] of cache) {
    if (entry.expiresAtMs <= now) cache.delete(ip)
  }
}

function setCache(ip: string, blocked: boolean, ttlMs: number, now: number) {
  if (cache.size >= CACHE_MAX_ENTRIES) pruneExpired(now)
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
  cache.set(ip, { blocked, expiresAtMs: now + Math.max(ttlMs, 1) })
}

function isCurrentlyBlocked(blockedIp: {
  deletedAt: Date | null
  expiresAt: Date | null
} | null) {
  if (!blockedIp || blockedIp.deletedAt) return false
  if (blockedIp.expiresAt && blockedIp.expiresAt < new Date()) return false
  return true
}

export const checkIp: MiddlewareHandler = async (c, next) => {
  const ip = getConnInfo(c).remote.address
  if (!ip) return next()

  const now = Date.now()
  const cached = cache.get(ip)
  if (cached && cached.expiresAtMs > now) {
    if (cached.blocked) return c.json({ message: "Your IP is blocked" }, 403)
    return next()
  }

  const blockedIp = await prisma.blockedIp.findUnique({
    where: { ipAddress: ip },
  })

  const blocked = isCurrentlyBlocked(blockedIp)

  let ttlMs = CACHE_TTL_MS
  if (blocked && blockedIp?.expiresAt) {
    ttlMs = Math.min(ttlMs, Math.max(blockedIp.expiresAt.getTime() - now, 1))
  }
  setCache(ip, blocked, ttlMs, now)

  if (blocked) return c.json({ message: "Your IP is blocked" }, 403)
  return next()
}
