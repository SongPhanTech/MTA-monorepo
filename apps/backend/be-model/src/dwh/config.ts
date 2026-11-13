export const MAX_BATCH_SIZE = 200

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback
}

const trimSlash = (value: string | undefined) => (value || "").trim().replace(/\/+$/, "")

const systemOrigin = trimSlash(process.env.SYSTEM_BASE_URL)

export const dwhConfig = {
  /** Khoá trục dùng gọi vào MTA (webhook + events) = Client Id/Secret của ứng dụng MTA trên MTA-SSO. */
  clientId: process.env.DWH_CLIENT_ID || "",
  clientSecret: process.env.DWH_CLIENT_SECRET || "",
  /** Mã ứng dụng MTA trên trục: FromAppCode của phiếu và `source` trong response. */
  sourceAppCode: process.env.DWH_SOURCE_APP_CODE || "Lms",
  /** App nhận dữ liệu (ToAppCode của phiếu PullCallback). */
  toAppCode: process.env.DWH_TO_APP_CODE || "ChiHuyDH",
  tenantCode: process.env.DWH_TENANT_CODE || "default",
  /** Chỉ trả bản ghi có updatedAt <= now - lag, tránh bỏ sót bản ghi đang ghi dở. */
  lagSeconds: Math.max(0, readNumber(process.env.DWH_SYNC_LAG_SECONDS, 60)),
  /** URL public của be-model (giống MSA), vd https://msa.swantech.vn/api/model — code tự nối /api/dwh/... */
  publicBaseUrl: trimSlash(process.env.DWH_PUBLIC_BASE_URL),
  /** Cổng exchange-data của trục. */
  exchangeUrl:
    trimSlash(process.env.DWH_EXCHANGE_URL) ||
    (systemOrigin ? `${systemOrigin}/api/system/sync/ESBs/exchange-data` : ""),
  /** Khoá MTA dùng gửi phiếu lên trục = khoá cấp ở màn Thiết lập kết nối API. */
  exchangeClientId: process.env.DWH_EXCHANGE_CLIENT_ID || "",
  exchangeClientSecret: process.env.DWH_EXCHANGE_CLIENT_SECRET || "",
  callbackRatePerSecond: Math.max(0.1, readNumber(process.env.DWH_CALLBACK_RATE_PER_SECOND, 2)),
  callbackTimeoutMs: Math.max(1000, readNumber(process.env.DWH_CALLBACK_TIMEOUT_MS, 10_000)),
  maxConcurrentRequests: Math.max(
    1,
    Math.floor(readNumber(process.env.DWH_MAX_CONCURRENT_REQUESTS, 2))
  ),
  maxQueuedRequests: Math.max(0, Math.floor(readNumber(process.env.DWH_MAX_QUEUED_REQUESTS, 50))),
  queueTimeoutMs: Math.max(1000, readNumber(process.env.DWH_QUEUE_TIMEOUT_MS, 20_000)),
}
