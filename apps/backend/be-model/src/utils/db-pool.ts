import { PrismaClient } from "@workspace/db"

function intEnv(name: string, fallback: number): number {
  const raw = Number.parseInt(process.env[name] || "", 10)
  return Number.isFinite(raw) && raw > 0 ? raw : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const DB_POOL_CONFIG = {
  connectionLimit: clamp(intEnv("DATABASE_POOL_SIZE", 30), 5, 100),
  poolTimeoutSec: clamp(intEnv("DATABASE_POOL_TIMEOUT", 15), 1, 60),
  connectTimeoutSec: clamp(intEnv("DATABASE_CONNECT_TIMEOUT", 10), 1, 30),
} as const

export function buildDatabaseUrl(baseUrl: string): string {
  if (!baseUrl) return baseUrl

  const params: Record<string, string> = {
    connection_limit: String(DB_POOL_CONFIG.connectionLimit),
    pool_timeout: String(DB_POOL_CONFIG.poolTimeoutSec),
    connect_timeout: String(DB_POOL_CONFIG.connectTimeoutSec),
  }

  let url = baseUrl
  for (const [key, value] of Object.entries(params)) {
    if (url.includes(`${key}=`)) continue
    url += `${url.includes("?") ? "&" : "?"}${key}=${value}`
  }
  return url
}

export function createPrismaClient(): PrismaClient {
  const url = buildDatabaseUrl(process.env.DATABASE_URL || "")
  console.log(
    `[db-pool] connection_limit=${DB_POOL_CONFIG.connectionLimit} ` +
      `pool_timeout=${DB_POOL_CONFIG.poolTimeoutSec}s ` +
      `connect_timeout=${DB_POOL_CONFIG.connectTimeoutSec}s`
  )
  return new PrismaClient({
    datasources: { db: { url } },
  })
}
