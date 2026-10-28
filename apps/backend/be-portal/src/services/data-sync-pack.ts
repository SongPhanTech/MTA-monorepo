/**
 * Đóng gói / mở gói đồng bộ: JSON → Gzip → AES-256-GCM.
 * Định dạng binary (đuôi .dat):
 *   magic[4]="MTAS" | ver[1]=1 | iv[12] | tag[16] | ciphertext[...]
 *
 * Khóa: DATA_SYNC_ENCRYPTION_KEY (hex 64 hoặc chuỗi bất kỳ → SHA-256),
 * fallback DATA_SYNC_HMAC_SECRET (cùng secret dùng chung 2 BE).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { gunzipSync, gzipSync } from "node:zlib"

export const SYNC_MAGIC = Buffer.from("MTAS")
export const SYNC_FORMAT_VERSION = 1
export const SYNC_FILE_EXT = ".dat"
export const SYNC_CONTENT_TYPE = "application/x-mta-dat"

const IV_LEN = 12
const TAG_LEN = 16
const HEADER_LEN = 4 + 1 + IV_LEN + TAG_LEN

export function getDataSyncEncryptionKey(): Buffer {
  const raw =
    process.env.DATA_SYNC_ENCRYPTION_KEY?.trim() || process.env.DATA_SYNC_HMAC_SECRET?.trim()
  if (!raw) {
    throw new Error(
      "Máy chủ chưa được cấu hình để đọc file đồng bộ. Vui lòng liên hệ quản trị hệ thống để cấu hình khóa đồng bộ rồi thực hiện lại."
    )
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }
  return createHash("sha256").update(raw, "utf8").digest()
}

export function isMtaSyncBinary(buf: Buffer): boolean {
  return buf.length >= HEADER_LEN && buf.subarray(0, 4).equals(SYNC_MAGIC)
}

export function packSyncPayload(jsonUtf8: string): Buffer {
  const compressed = gzipSync(Buffer.from(jsonUtf8, "utf8"), { level: 6 })
  const key = getDataSyncEncryptionKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([SYNC_MAGIC, Buffer.from([SYNC_FORMAT_VERSION]), iv, tag, ciphertext])
}

export function unpackSyncPayload(packed: Buffer): string {
  if (!isMtaSyncBinary(packed)) {
    throw new Error("File không đúng định dạng gói đồng bộ .dat của hệ thống.")
  }
  const ver = packed[4]
  if (ver !== SYNC_FORMAT_VERSION) {
    throw new Error(
      "File .dat được tạo bởi phiên bản chưa được hỗ trợ. Hãy xuất lại file từ hệ thống nguồn."
    )
  }
  const iv = packed.subarray(5, 5 + IV_LEN)
  const tag = packed.subarray(5 + IV_LEN, 5 + IV_LEN + TAG_LEN)
  const ciphertext = packed.subarray(HEADER_LEN)

  const key = getDataSyncEncryptionKey()
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  let compressed: Buffer
  try {
    compressed = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch {
    throw new Error(
      "Không thể mở file .dat. File có thể bị hỏng, bị thay đổi hoặc được xuất từ hệ thống dùng khóa đồng bộ khác."
    )
  }
  try {
    return gunzipSync(compressed).toString("utf8")
  } catch {
    throw new Error(
      "Nội dung file .dat không hợp lệ hoặc bị hỏng. Hãy xuất lại file từ hệ thống nguồn."
    )
  }
}

export function decodeImportBytes(bytes: Buffer): unknown {
  if (isMtaSyncBinary(bytes)) {
    return JSON.parse(unpackSyncPayload(bytes))
  }
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "")
  if (!text.trimStart().startsWith("{")) {
    throw new Error("Định dạng file không hỗ trợ (cần .dat mã hóa hoặc JSON cũ)")
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Nội dung JSON của file không hợp lệ. Hãy xuất lại file từ hệ thống nguồn.")
  }
}
