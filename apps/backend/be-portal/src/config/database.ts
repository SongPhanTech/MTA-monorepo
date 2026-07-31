/**
 * Cấu hình Database Connection Pool cho be-portal.
 *
 * Bài toán: ~600 sinh viên thao tác đồng thời khi mở đợt đăng ký (thundering herd).
 * Nếu không giới hạn pool, mỗi request mở connection mới → PostgreSQL cạn
 * max_connections và chết toàn hệ thống.
 *
 * Nguyên tắc:
 * - connection_limit: chặn trần số connection app được mở (mặc định 50, trần cứng 100).
 *   Request vượt quá KHÔNG làm sập DB mà xếp hàng chờ connection trống.
 * - pool_timeout: thời gian tối đa một request chờ trong hàng đợi lấy connection.
 *   Hết hạn → Prisma ném P2024, API trả 503 để client retry, thay vì treo vô hạn.
 * - connect_timeout: thời gian tối đa chờ bắt tay TCP/auth với PostgreSQL.
 */
import { PrismaClient } from "@workspace/db"

function intEnv(name: string, fallback: number): number {
  const raw = Number.parseInt(process.env[name] || "", 10)
  return Number.isFinite(raw) && raw > 0 ? raw : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const DB_POOL_CONFIG = {
  /** Số connection tối đa app được mở tới PostgreSQL. An toàn: 50–100. */
  connectionLimit: clamp(intEnv("DATABASE_POOL_SIZE", 50), 5, 100),
  /** Giây — request chờ lấy connection từ pool, quá hạn → P2024 (map ra 503). */
  poolTimeoutSec: clamp(intEnv("DATABASE_POOL_TIMEOUT", 15), 1, 60),
  /** Giây — timeout mở connection mới tới PostgreSQL. */
  connectTimeoutSec: clamp(intEnv("DATABASE_CONNECT_TIMEOUT", 10), 1, 30),
} as const

/**
 * Gắn tham số pool vào DATABASE_URL.
 * Tham số đã có sẵn trên URL được giữ nguyên (ưu tiên cấu hình thủ công).
 */
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
