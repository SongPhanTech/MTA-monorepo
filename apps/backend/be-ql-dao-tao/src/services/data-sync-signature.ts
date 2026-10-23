/**
 * HMAC-SHA256 toàn vẹn gói JSON xuất Nội bộ → Internet.
 * Secret dùng chung với be-portal: DATA_SYNC_HMAC_SECRET
 */
import { createHmac, timingSafeEqual } from "node:crypto"

export function getDataSyncHmacSecret(): string {
  const secret = process.env.DATA_SYNC_HMAC_SECRET?.trim()
  if (!secret) {
    throw new Error(
      "DATA_SYNC_HMAC_SECRET chưa cấu hình — bắt buộc để ký / kiểm tra gói xuất dữ liệu"
    )
  }
  return secret
}

/** Ký object payload (chưa có field signature). */
export function signExportPayload(payloadWithoutSignature: Record<string, unknown>): string {
  const body = JSON.stringify(payloadWithoutSignature)
  return createHmac("sha256", getDataSyncHmacSecret()).update(body, "utf8").digest("hex")
}

export function attachExportSignature<T extends Record<string, unknown>>(
  payload: T
): T & { signature: string } {
  const signature = signExportPayload(payload)
  return { ...payload, signature }
}

export function verifyExportSignature(parsed: Record<string, unknown>): void {
  const signature = parsed.signature
  if (typeof signature !== "string" || !signature) {
    throw new Error(
      "File thiếu chữ ký toàn vẹn (signature). File có thể bị sửa hoặc xuất từ phiên bản cũ."
    )
  }
  const { signature: _ignored, ...rest } = parsed
  const expected = signExportPayload(rest)
  const a = Buffer.from(signature, "hex")
  const b = Buffer.from(expected, "hex")
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Không nhập được dữ liệu")
  }
}
