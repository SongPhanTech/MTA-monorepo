/**
 * Lưu tạm gói import (.dat binary hoặc JSON legacy) trên Redis (base64).
 * Key: portal:import_payload:{syncHistoryId}
 * TTL mặc định 2 giờ.
 */
import { withRedis } from "../redis-cache"
import { decodeImportBytes, isMtaSyncBinary } from "../data-sync-pack"

const TTL_SECONDS = Number(process.env.DATA_SYNC_IMPORT_TTL_SEC || 7200)
const PREFIX = "portal:import_payload:"
const META_PREFIX = "portal:import_payload_meta:"

function payloadKey(syncHistoryId: string) {
  return `${PREFIX}${syncHistoryId}`
}

function metaKey(syncHistoryId: string) {
  return `${META_PREFIX}${syncHistoryId}`
}

/** @deprecated */
export function importDir() {
  return "(redis)"
}

export async function saveImportPayload(
  syncHistoryId: string,
  bytes: Buffer | Uint8Array
): Promise<void> {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
  const ok = await withRedis(async (redis) => {
    await redis.set(payloadKey(syncHistoryId), buf.toString("base64"), "EX", TTL_SECONDS)
    await redis.set(
      metaKey(syncHistoryId),
      JSON.stringify({
        encoding: "base64",
        fileSize: buf.byteLength,
        format: isMtaSyncBinary(buf) ? "mta-sync" : "json",
      }),
      "EX",
      TTL_SECONDS
    )
    return true
  })
  if (!ok) {
    throw new Error(
      "Không lưu được file import vào Redis. Kiểm tra REDIS_URL và kết nối Redis."
    )
  }
}

export async function saveImportFile(
  syncHistoryId: string,
  bytes: Buffer | Uint8Array
): Promise<string> {
  await saveImportPayload(syncHistoryId, bytes)
  return payloadKey(syncHistoryId)
}

export async function readImportPayloadBytes(syncHistoryId: string): Promise<Buffer> {
  const raw = await withRedis(async (redis) => {
    const v = await redis.get(payloadKey(syncHistoryId))
    return v == null ? null : String(v)
  })
  if (raw == null) {
    throw new Error(
      `Không tìm thấy payload import trên Redis (history=${syncHistoryId}). File có thể đã hết hạn.`
    )
  }
  // Ưu tiên base64; nếu decode ra MTAS hoặc JSON hợp lệ dùng luôn
  const asB64 = Buffer.from(raw, "base64")
  if (isMtaSyncBinary(asB64) || asB64.toString("utf8").trimStart().startsWith("{")) {
    return asB64
  }
  // Legacy: lưu plaintext UTF-8
  return Buffer.from(raw, "utf8")
}

export async function readImportPayload(syncHistoryId: string): Promise<unknown> {
  const bytes = await readImportPayloadBytes(syncHistoryId)
  return decodeImportBytes(bytes)
}

export async function readImportJson(filePathOrHistoryId: string): Promise<unknown> {
  const syncHistoryId = filePathOrHistoryId.startsWith(PREFIX)
    ? filePathOrHistoryId.slice(PREFIX.length)
    : filePathOrHistoryId.includes("/")
      ? filePathOrHistoryId.replace(/^.*\//, "").replace(/\.(json|sync|dat)$/i, "")
      : filePathOrHistoryId
  return readImportPayload(syncHistoryId)
}

export async function removeImportPayload(syncHistoryId: string): Promise<void> {
  await withRedis(async (redis) => {
    await redis.del(payloadKey(syncHistoryId))
    await redis.del(metaKey(syncHistoryId))
  })
}

export async function removeImportFile(filePathOrHistoryId: string): Promise<void> {
  const syncHistoryId = filePathOrHistoryId.startsWith(PREFIX)
    ? filePathOrHistoryId.slice(PREFIX.length)
    : filePathOrHistoryId.includes("/")
      ? filePathOrHistoryId.replace(/^.*\//, "").replace(/\.(json|sync|dat)$/i, "")
      : filePathOrHistoryId
  await removeImportPayload(syncHistoryId)
}
