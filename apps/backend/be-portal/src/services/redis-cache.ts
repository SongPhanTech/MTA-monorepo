/**
 * Redis cache cho đăng ký học (Bun native RedisClient).
 * Không set REDIS_URL → no-op (API vẫn chạy bình thường).
 */
import { RedisClient } from "bun"

const REDIS_URL = process.env.REDIS_URL?.trim()
const ENABLED = Boolean(REDIS_URL) && process.env.REDIS_CACHE_ENABLED !== "false"
const RATE_LIMIT_ENABLED =
  Boolean(REDIS_URL) && process.env.REDIS_RATE_LIMIT_ENABLED !== "false"

/** TTL giây */
export const CACHE_TTL = {
  /** Đợt ĐK + creditLimit theo user */
  session: Number(process.env.REDIS_TTL_SESSION || 60),
  /** Info SV + maxCredit */
  student: Number(process.env.REDIS_TTL_STUDENT || 60),
  /** get-classes-info — short TTL vì sĩ số thay đổi liên tục */
  classesInfo: Number(process.env.REDIS_TTL_CLASSES_INFO || 5),
} as const

const PREFIX = "portal:crs"

function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Date) return { __t: "Date", v: value.toISOString() }
  if (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
  ) {
    return { __t: "Decimal", v: (value as { toNumber: () => number }).toNumber() }
  }
  return value
}

function jsonReviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as { __t?: string; v?: string | number }
    if (o.__t === "Date" && typeof o.v === "string") return new Date(o.v)
    if (o.__t === "Decimal" && typeof o.v === "number") return o.v
  }
  return value
}

let client: RedisClient | null = null
let connecting: Promise<RedisClient | null> | null = null

function redisHostHint() {
  try {
    return REDIS_URL ? new URL(REDIS_URL).host : "(none)"
  } catch {
    return "(invalid REDIS_URL)"
  }
}

async function getClient(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null
  if (client) return client
  if (connecting) return connecting

  connecting = (async () => {
    try {
      // Remote Redis: timeout dài hơn, queue khi đang reconnect (tránh ERR_REDIS_CONNECTION_CLOSED sớm)
      const redis = new RedisClient(REDIS_URL, {
        connectionTimeout: Number(process.env.REDIS_CONNECTION_TIMEOUT || 8000),
        autoReconnect: true,
        maxRetries: Number(process.env.REDIS_MAX_RETRIES || 20),
        enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE !== "false",
      })
      await redis.connect()
      client = redis
      console.log(`[redis-cache] connected ${redisHostHint()}`)
      return client
    } catch (e) {
      console.warn(`[redis-cache] connect failed host=${redisHostHint()}`, e)
      client = null
      return null
    } finally {
      connecting = null
    }
  })()

  return connecting
}

async function withRedis<T>(fn: (redis: RedisClient) => Promise<T>): Promise<T | null> {
  if (!ENABLED && !RATE_LIMIT_ENABLED) return null
  const redis = await getClient()
  if (!redis) return null
  try {
    return await fn(redis)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[redis-cache] op failed host=${redisHostHint()}`, e)
    if (
      msg.includes("Connection is closed") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("Connection timed out")
    ) {
      try {
        client?.close()
      } catch {
        /* ignore */
      }
      client = null
    }
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!ENABLED) return null
  const raw = await withRedis((redis) => redis.get(key))
  if (raw == null) return null
  try {
    return JSON.parse(String(raw), jsonReviver) as T
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
  if (!ENABLED || ttlSec <= 0) return
  await withRedis((redis) => redis.set(key, JSON.stringify(value, jsonReplacer), "EX", ttlSec))
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!ENABLED || keys.length === 0) return
  await withRedis(async (redis) => {
    for (const key of keys) {
      await redis.del(key)
    }
  })
}

export async function cacheIncr(key: string): Promise<number> {
  if (!ENABLED) return Date.now()
  const n = await withRedis((redis) => redis.incr(key))
  return typeof n === "number" ? n : Date.now()
}

export async function cacheExpire(key: string, ttlSec: number): Promise<void> {
  if (ttlSec <= 0) return
  await withRedis((redis) => redis.expire(key, ttlSec))
}

export async function cacheGetNumber(key: string): Promise<number> {
  if (!ENABLED) return 0
  const v = await withRedis((redis) => redis.get(key))
  if (v == null) return 0
  return Number(v) || 0
}

/** Fixed-window rate limit. Redis down → cho qua (fail-open). */
export async function rateLimitConsume(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSec: number; count: number }> {
  if (!RATE_LIMIT_ENABLED || limit <= 0 || windowSec <= 0) {
    return { allowed: true, remaining: limit, retryAfterSec: 0, count: 0 }
  }

  const count = await withRedis(async (redis) => {
    const n = await redis.incr(key)
    if (n === 1) {
      await redis.expire(key, windowSec)
    }
    return typeof n === "number" ? n : 0
  })

  // Redis lỗi / không có → fail-open
  if (count == null || count === 0) {
    return { allowed: true, remaining: limit, retryAfterSec: 0, count: 0 }
  }

  const allowed = count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    retryAfterSec: allowed ? 0 : windowSec,
    count,
  }
}

export const RATE_LIMIT = {
  register: {
    max: Number(process.env.REDIS_RL_REGISTER_MAX || 20),
    windowSec: Number(process.env.REDIS_RL_REGISTER_WINDOW || 60),
  },
  unregister: {
    max: Number(process.env.REDIS_RL_UNREGISTER_MAX || 20),
    windowSec: Number(process.env.REDIS_RL_UNREGISTER_WINDOW || 60),
  },
  /** get-classes-info — chống spam refresh */
  read: {
    max: Number(process.env.REDIS_RL_READ_MAX || 120),
    windowSec: Number(process.env.REDIS_RL_READ_WINDOW || 60),
  },
} as const

export function rateLimitKey(action: "register" | "unregister" | "read", userId: string) {
  return `${PREFIX}:rl:${action}:${userId}`
}

/** Keys & helpers cho đăng ký học */
export const classRegisterCache = {
  sessionKey: (userId: string) => `${PREFIX}:session:${userId}`,

  studentKey: (userId: string, sessionId: string) =>
    `${PREFIX}:student:${userId}:${sessionId || "_"}`,

  userVersionKey: (userId: string) => `${PREFIX}:uver:${userId}`,

  async classesInfoKey(
    userId: string,
    sessionId: string,
    curriculumVersionId: string,
    byCurriculum: boolean,
    isRegistered: boolean
  ) {
    const ver = await cacheGetNumber(this.userVersionKey(userId))
    return `${PREFIX}:classes:${userId}:v${ver}:${sessionId}:${curriculumVersionId}:${byCurriculum}:${isRegistered}`
  },

  /** Sau ĐK/huỷ: invalidate ngay cache cá nhân */
  async invalidateUser(userId: string, sessionId?: string) {
    await cacheIncr(this.userVersionKey(userId))
    await cacheDel(this.sessionKey(userId))
    if (sessionId) {
      await cacheDel(this.studentKey(userId, sessionId))
    }
  },
}

export function isRedisCacheEnabled() {
  return ENABLED
}
