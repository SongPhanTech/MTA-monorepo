/**
 * Redis store cho trạng thái job xuất dữ liệu bất đồng bộ.
 * Chỉ dùng Redis — không fallback Map in-process.
 */
import { RedisClient } from "bun"

export type ExportJobStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"

export type ExportJobState = {
  jobId: string
  status: ExportJobStatus
  progress: number
  message: string
  classRegisterSessionId?: string
  /** User tạo job — dùng kiểm tra quyền download */
  createdByUserId?: string
  /** @deprecated Không còn ghi file disk */
  filePath?: string
  fileName?: string
  fileSize?: number
  recordCounts?: Record<string, number>
  error?: string
  createdAt: string
  updatedAt: string
}

const REDIS_URL = process.env.REDIS_URL?.trim()
const TTL_SECONDS = 3600
const PREFIX = "qldt:export_job:"
const ACTIVE_SET_KEY = "qldt:export_active_jobs"

/** Số job PENDING/PROCESSING đồng thời tối đa (tránh Redis OOM khi nhiều full export). */
export const EXPORT_MAX_CONCURRENT = Math.max(
  1,
  Number(process.env.EXPORT_MAX_CONCURRENT || 3) || 3
)

let redisClient: RedisClient | null = null

async function requireRedis(): Promise<RedisClient> {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL chưa cấu hình — bắt buộc cho tiến trình xuất dữ liệu")
  }
  if (redisClient) return redisClient
  try {
    const client = new RedisClient(REDIS_URL, {
      connectionTimeout: 5000,
      maxRetries: 3,
    })
    await client.connect()
    redisClient = client
    console.log(`[export-redis-store] Connected to Redis at ${new URL(REDIS_URL).host}`)
    return redisClient
  } catch (err) {
    throw new Error(
      `Không kết nối được Redis: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

export async function countActiveExportJobs(): Promise<number> {
  const redis = await requireRedis()
  const n = await redis.send("SCARD", [ACTIVE_SET_KEY])
  return Number(n) || 0
}

async function trackActiveJob(jobId: string): Promise<void> {
  const redis = await requireRedis()
  await redis.send("SADD", [ACTIVE_SET_KEY, jobId])
  await redis.send("EXPIRE", [ACTIVE_SET_KEY, String(TTL_SECONDS)])
}

async function untrackActiveJob(jobId: string): Promise<void> {
  try {
    const redis = await requireRedis()
    await redis.send("SREM", [ACTIVE_SET_KEY, jobId])
  } catch {
    /* ignore */
  }
}

export async function setExportJob(state: ExportJobState): Promise<void> {
  state.updatedAt = new Date().toISOString()
  const redis = await requireRedis()
  await redis.set(`${PREFIX}${state.jobId}`, JSON.stringify(state), "EX", TTL_SECONDS)
  if (state.status === "PENDING" || state.status === "PROCESSING") {
    await trackActiveJob(state.jobId)
  } else {
    await untrackActiveJob(state.jobId)
  }
}

export async function getExportJob(jobId: string): Promise<ExportJobState | null> {
  try {
    const redis = await requireRedis()
    const raw = await redis.get(`${PREFIX}${jobId}`)
    if (!raw) return null
    return JSON.parse(String(raw)) as ExportJobState
  } catch (e) {
    console.warn(`[export-redis-store] Lỗi đọc Redis job ${jobId}:`, e)
    return null
  }
}

export async function updateExportJobProgress(
  jobId: string,
  progress: number,
  message: string,
  extra: Partial<ExportJobState> = {}
): Promise<void> {
  console.log(`[export-worker] [${jobId}] ${progress}% - ${message}`)
  const current = await getExportJob(jobId)
  if (!current) return

  const updated: ExportJobState = {
    ...current,
    ...extra,
    status: "PROCESSING",
    progress: Math.min(100, Math.max(0, progress)),
    message,
    updatedAt: new Date().toISOString(),
  }
  await setExportJob(updated)
}

export async function markExportJobSuccess(
  jobId: string,
  fileName: string,
  fileSize: number,
  recordCounts: Record<string, number>
): Promise<void> {
  const current = await getExportJob(jobId)
  if (!current) return

  const updated: ExportJobState = {
    ...current,
    status: "SUCCESS",
    progress: 100,
    message: "Xuất dữ liệu thành công",
    filePath: undefined,
    fileName,
    fileSize,
    recordCounts,
    updatedAt: new Date().toISOString(),
  }
  await setExportJob(updated)
}

export async function markExportJobFailed(jobId: string, error: string): Promise<void> {
  const current = await getExportJob(jobId)
  if (!current) return

  const updated: ExportJobState = {
    ...current,
    status: "FAILED",
    progress: 100,
    message: "Không xuất được dữ liệu",
    error,
    updatedAt: new Date().toISOString(),
  }
  await setExportJob(updated)
}
