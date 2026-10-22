/**
 * Lưu tạm gói xuất (.dat binary: gzip+AES-GCM) trên Redis.
 * Key payload lưu base64 để tránh lỗi binary qua Redis string.
 * TTL 1 giờ.
 */
import { RedisClient } from "bun"

const REDIS_URL = process.env.REDIS_URL?.trim()
const TTL_SECONDS = 3600
const PAYLOAD_PREFIX = "qldt:export_payload:"
const META_PREFIX = "qldt:export_payload_meta:"

let redisClient: RedisClient | null = null

async function requireRedis(): Promise<RedisClient> {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL chưa cấu hình — bắt buộc để lưu payload xuất dữ liệu")
  }
  if (redisClient) return redisClient
  try {
    const client = new RedisClient(REDIS_URL, {
      connectionTimeout: 8000,
      autoReconnect: true,
      maxRetries: 10,
    })
    await client.connect()
    redisClient = client
    console.log(`[export-payload-store] Connected to Redis at ${new URL(REDIS_URL).host}`)
    return redisClient
  } catch (err) {
    throw new Error(
      `Không kết nối được Redis để lưu payload xuất: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

export const EXPORT_PAYLOAD_MAX_MB = Math.max(
  16,
  Number(process.env.EXPORT_PAYLOAD_MAX_MB || 256) || 256
)

export async function setExportPayloadBinary(
  jobId: string,
  bytes: Buffer,
  fileName: string
): Promise<number> {
  const redis = await requireRedis()
  const fileSize = bytes.byteLength
  const maxBytes = EXPORT_PAYLOAD_MAX_MB * 1024 * 1024
  if (fileSize > maxBytes) {
    throw new Error(
      `Payload xuất ${(fileSize / (1024 * 1024)).toFixed(1)} MB vượt giới hạn Redis ${EXPORT_PAYLOAD_MAX_MB} MB. ` +
        `Hãy xuất theo đợt hoặc tăng EXPORT_PAYLOAD_MAX_MB / chuyển sang object storage (MinIO).`
    )
  }
  const meta = JSON.stringify({
    fileName,
    fileSize,
    encoding: "base64",
    contentType: "application/x-mta-dat",
  })
  await redis.set(`${PAYLOAD_PREFIX}${jobId}`, bytes.toString("base64"), "EX", TTL_SECONDS)
  await redis.set(`${META_PREFIX}${jobId}`, meta, "EX", TTL_SECONDS)
  return fileSize
}

/** @deprecated Dùng setExportPayloadBinary */
export async function setExportPayload(
  jobId: string,
  json: string,
  fileName: string
): Promise<number> {
  return setExportPayloadBinary(jobId, Buffer.from(json, "utf8"), fileName)
}

export async function getExportPayloadBinary(
  jobId: string
): Promise<{ bytes: Buffer; fileName: string; fileSize: number; contentType: string } | null> {
  try {
    const redis = await requireRedis()
    const [raw, metaRaw] = await Promise.all([
      redis.get(`${PAYLOAD_PREFIX}${jobId}`),
      redis.get(`${META_PREFIX}${jobId}`),
    ])
    if (raw == null) return null

    let fileName = `export-${jobId.slice(0, 8)}.dat`
    let fileSize = 0
    let encoding: "base64" | "utf8" = "base64"
    let contentType = "application/x-mta-dat"

    if (metaRaw != null) {
      try {
        const meta = JSON.parse(String(metaRaw)) as {
          fileName?: string
          fileSize?: number
          encoding?: string
          contentType?: string
        }
        if (meta.fileName) fileName = meta.fileName
        if (typeof meta.fileSize === "number") fileSize = meta.fileSize
        if (meta.encoding === "utf8") encoding = "utf8"
        if (meta.contentType) contentType = meta.contentType
      } catch {
        /* ignore */
      }
    }

    const bytes =
      encoding === "utf8" ? Buffer.from(String(raw), "utf8") : Buffer.from(String(raw), "base64")
    if (!fileSize) fileSize = bytes.byteLength
    return { bytes, fileName, fileSize, contentType }
  } catch (err) {
    console.warn(`[export-payload-store] Lỗi đọc payload ${jobId}:`, err)
    return null
  }
}

/** @deprecated */
export async function getExportPayload(
  jobId: string
): Promise<{ json: string; fileName: string; fileSize: number } | null> {
  const bin = await getExportPayloadBinary(jobId)
  if (!bin) return null
  return { json: bin.bytes.toString("utf8"), fileName: bin.fileName, fileSize: bin.fileSize }
}

export async function deleteExportPayload(jobId: string): Promise<void> {
  try {
    const redis = await requireRedis()
    await redis.del(`${PAYLOAD_PREFIX}${jobId}`)
    await redis.del(`${META_PREFIX}${jobId}`)
  } catch (err) {
    console.warn(`[export-payload-store] Lỗi xóa payload ${jobId}:`, err)
  }
}
