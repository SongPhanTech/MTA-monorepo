/**
 * HMAC-SHA256 toàn vẹn gói JSON xuất Nội bộ → Internet.
 * Secret dùng chung với be-ql-dao-tao: DATA_SYNC_HMAC_SECRET
 */
import { createHmac, timingSafeEqual } from "node:crypto"

export function getDataSyncHmacSecret(): string {
  const secret = process.env.DATA_SYNC_HMAC_SECRET?.trim()
  if (!secret) {
    throw new Error(
      "DATA_SYNC_HMAC_SECRET chưa cấu hình — bắt buộc để kiểm tra gói nhập dữ liệu"
    )
  }
  return secret
}

export function signExportPayload(payloadWithoutSignature: Record<string, unknown>): string {
  const body = JSON.stringify(payloadWithoutSignature)
  return createHmac("sha256", getDataSyncHmacSecret()).update(body, "utf8").digest("hex")
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

/** Version ≥ 1.5.2 bắt buộc có signature hợp lệ. */
export function requiresExportSignature(version?: string): boolean {
  if (!version) return false
  const parts = version.split(".").map((p) => Number(p))
  const [maj = 0, min = 0, pat = 0] = parts
  if (maj > 1) return true
  if (maj === 1 && min > 5) return true
  if (maj === 1 && min === 5 && pat >= 2) return true
  return false
}
