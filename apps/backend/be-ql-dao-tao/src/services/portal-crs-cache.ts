/**
 * Xóa Redis cache đăng ký học (cùng prefix với be-portal) khi admin sửa đợt.
 * Cần REDIS_URL trỏ cùng Redis với be-portal.
 */
import { RedisClient } from "bun"

const REDIS_URL = process.env.REDIS_URL?.trim()
const ENABLED = Boolean(REDIS_URL) && process.env.REDIS_CACHE_ENABLED !== "false"
const PREFIX = "portal:crs"

let client: RedisClient | null = null
let connecting: Promise<RedisClient | null> | null = null

async function getClient(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null
  if (client) return client
  if (connecting) return connecting
  connecting = (async () => {
    try {
      const redis = new RedisClient(REDIS_URL, {
        connectionTimeout: Number(process.env.REDIS_CONNECTION_TIMEOUT || 8000),
        autoReconnect: true,
        maxRetries: Number(process.env.REDIS_MAX_RETRIES || 20),
        enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE !== "false",
      })
      await redis.connect()
      client = redis
      return client
    } catch (e) {
      console.warn("[portal-crs-cache] redis connect failed", e)
      client = null
      return null
    } finally {
      connecting = null
    }
  })()
  return connecting
}

async function withRedis<T>(fn: (redis: RedisClient) => Promise<T>): Promise<T | null> {
  if (!ENABLED) return null
  const redis = await getClient()
  if (!redis) return null
  try {
    return await fn(redis)
  } catch (e) {
    console.warn("[portal-crs-cache] op failed", e)
    return null
  }
}

async function delByPattern(pattern: string): Promise<number> {
  let deleted = 0
  await withRedis(async (redis) => {
    let cursor = "0"
    do {
      const raw = await redis.send("SCAN", [cursor, "MATCH", pattern, "COUNT", "200"])
      const next = Array.isArray(raw) ? String(raw[0] ?? "0") : "0"
      const keys = Array.isArray(raw) && Array.isArray(raw[1]) ? (raw[1] as string[]) : []
      cursor = next
      for (const key of keys) {
        await redis.del(key)
        deleted += 1
      }
    } while (cursor !== "0")
  })
  return deleted
}

/** Invalidate cache portal khi sửa đợt đăng ký học */
export async function invalidateClassRegisterSessionCache(
  sessionId: string
): Promise<{ deleted: number; skipped: boolean }> {
  if (!sessionId) return { deleted: 0, skipped: true }
  if (!ENABLED) {
    console.log("[portal-crs-cache] REDIS chưa cấu hình → bỏ qua invalidate")
    return { deleted: 0, skipped: true }
  }

  let deleted = 0
  deleted += await delByPattern(`${PREFIX}:session:*`)
  deleted += await delByPattern(`${PREFIX}:student:*:${sessionId}*`)
  deleted += await delByPattern(`${PREFIX}:classes:*:${sessionId}:*`)
  await withRedis(async (redis) => {
    await redis.del(`${PREFIX}:seats:${sessionId}`)
  })
  deleted += 1

  console.log(`[portal-crs-cache] invalidate sessionId=${sessionId} deleted≈${deleted}`)
  return { deleted, skipped: false }
}
