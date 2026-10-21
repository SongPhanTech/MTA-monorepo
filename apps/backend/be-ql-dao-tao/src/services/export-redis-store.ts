/**
 * Redis & In-Memory Store cho trạng thái các tác vụ xuất dữ liệu bất đồng bộ.
 * Sử dụng Bun native RedisClient khi có REDIS_URL, tự động fallback in-memory nếu chưa cấu hình.
 */
import { RedisClient } from "bun"

export type ExportJobStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"

export type ExportJobState = {
  jobId: string
  status: ExportJobStatus
  progress: number
  message: string
  classRegisterSessionId?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  recordCounts?: Record<string, number>
  error?: string
  createdAt: string
  updatedAt: string
}

const REDIS_URL = process.env.REDIS_URL?.trim()
const TTL_SECONDS = 3600 // Lưu cache trạng thái trong 1 giờ
const PREFIX = "qldt:export_job:"

const memoryStore = new Map<string, ExportJobState>()
let redisClient: RedisClient | null = null

async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null
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
    console.warn("[export-redis-store] Không thể kết nối Redis, chuyển sang lưu bộ nhớ:", err)
    return null
  }
}

export async function setExportJob(state: ExportJobState): Promise<void> {
  state.updatedAt = new Date().toISOString()
  memoryStore.set(state.jobId, state)

  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(`${PREFIX}${state.jobId}`, JSON.stringify(state), "EX", TTL_SECONDS)
    } catch (e) {
      console.warn(`[export-redis-store] Lỗi ghi Redis job ${state.jobId}:`, e)
    }
  }
}

export async function getExportJob(jobId: string): Promise<ExportJobState | null> {
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`${PREFIX}${jobId}`)
      if (raw) {
        return JSON.parse(String(raw)) as ExportJobState
      }
    } catch (e) {
      console.warn(`[export-redis-store] Lỗi đọc Redis job ${jobId}:`, e)
    }
  }
  return memoryStore.get(jobId) || null
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
  filePath: string,
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
    filePath,
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
    message: `Xuất dữ liệu thất bại: ${error}`,
    error,
    updatedAt: new Date().toISOString(),
  }
  await setExportJob(updated)
}
