/**
 * Redis helper cho nonce chống replay (Bun native RedisClient).
 * Không có REDIS_URL → replay guard fail-closed nếu AUTH bật, hoặc skip khi AUTH disabled.
 */
import { RedisClient } from "bun"

const REDIS_URL = process.env.REDIS_URL?.trim()

let client: RedisClient | null = null
let connecting: Promise<RedisClient | null> | null = null

function hostHint() {
  try {
    return REDIS_URL ? new URL(REDIS_URL).host : "(none)"
  } catch {
    return "(invalid REDIS_URL)"
  }
}

export async function getRedis(): Promise<RedisClient | null> {
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
      console.log(`[shared-redis] connected ${hostHint()}`)
      return client
    } catch (e) {
      console.warn(`[shared-redis] connect failed host=${hostHint()}`, e)
      client = null
      return null
    } finally {
      connecting = null
    }
  })()

  return connecting
}

/** SET key NX EX — true nếu set thành công (nonce mới). */
export async function setNonceOnce(nonce: string, ttlSeconds: number): Promise<boolean | null> {
  const redis = await getRedis()
  if (!redis) return null
  const key = `shared:nonce:${nonce}`
  // Bun RedisClient: SET key value EX seconds NX
  const result = await redis.set(key, "1", "EX", ttlSeconds, "NX")
  return result === "OK"
}
