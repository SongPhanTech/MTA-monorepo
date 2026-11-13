import { dwhConfig } from "./config"
import type { DwhEventName } from "./event-names"
import type { DwhPullParams } from "./events"

const RETRY_DELAYS_MS = [1000, 5000, 15_000]

const RETRYABLE_STATUS_CODES = [408, 425, 429]

type ExchangeResult = { ok: boolean; retryable: boolean; status?: number; body: string }

class RateLimiter {
  private readonly intervalMs: number
  private nextSlotAt = 0

  constructor(ratePerSecond: number) {
    this.intervalMs = 1000 / ratePerSecond
  }

  async acquire() {
    const now = Date.now()
    const slotAt = Math.max(now, this.nextSlotAt)
    this.nextSlotAt = slotAt + this.intervalMs
    if (slotAt > now) await Bun.sleep(slotAt - now)
  }
}

const rateLimiter = new RateLimiter(dwhConfig.callbackRatePerSecond)

export const toPullParams = ({ id, limit, cursor }: DwhPullParams): DwhPullParams =>
  id ? { id } : { limit, cursor }

export const buildPullCallbackBody = (
  eventName: DwhEventName,
  params: DwhPullParams,
  tx?: string,
  toAppCode: string = dwhConfig.toAppCode
) => ({
  Tx: tx,
  FromAppCode: dwhConfig.sourceAppCode,
  ToAppCode: toAppCode,
  BusinessType: eventName,
  ActionType: "PullCallback",
  TenantCode: dwhConfig.tenantCode,
  Message: JSON.stringify({
    Endpoint: `${dwhConfig.publicBaseUrl}/api/dwh/events/${eventName}`,
    Method: "POST",
    Params: JSON.stringify(toPullParams(params)),
  }),
})

const exchangeHeaders = () => ({
  "Content-Type": "application/json",
  "x-clientid": dwhConfig.exchangeClientId,
  "x-clientsecret": dwhConfig.exchangeClientSecret,
})


const resolveRequesterAppCode = async (tx?: string) => {
  const syncBaseUrl = dwhConfig.exchangeUrl.replace(/\/ESBs\/exchange-data\/?$/i, "")
  if (!tx || syncBaseUrl === dwhConfig.exchangeUrl) return dwhConfig.toAppCode
  try {
    const response = await fetch(`${syncBaseUrl}/sync/pull/${encodeURIComponent(tx)}/status`, {
      headers: exchangeHeaders(),
      signal: AbortSignal.timeout(dwhConfig.callbackTimeoutMs),
    })
    if (response.ok) {
      const status = (await response.json()) as Record<string, unknown>
      const requester = status.FromAppCode ?? status.fromAppCode
      if (typeof requester === "string" && requester.trim()) return requester.trim()
    }
    console.warn("[dwh] Không tra được app yêu cầu theo Tx, dùng DWH_TO_APP_CODE", tx, response.status)
  } catch (error) {
    console.warn("[dwh] Lỗi tra app yêu cầu theo Tx, dùng DWH_TO_APP_CODE", tx, error)
  }
  return dwhConfig.toAppCode
}

const postExchangeData = async (body: unknown): Promise<ExchangeResult> => {
  try {
    const response = await fetch(dwhConfig.exchangeUrl, {
      method: "POST",
      headers: exchangeHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(dwhConfig.callbackTimeoutMs),
    })
    const text = await response.text().catch(() => "")
    return {
      ok: response.ok,
      retryable: response.status >= 500 || RETRYABLE_STATUS_CODES.includes(response.status),
      status: response.status,
      body: text,
    }
  } catch (error) {
    return { ok: false, retryable: true, body: error instanceof Error ? error.message : String(error) }
  }
}

export const canSendPullCallback = () =>
  Boolean(
    dwhConfig.exchangeUrl &&
      dwhConfig.exchangeClientId &&
      dwhConfig.exchangeClientSecret &&
      dwhConfig.publicBaseUrl
  )

/** Gửi phiếu PullCallback lên exchange-data, có giãn nhịp và thử lại khi lỗi tạm thời. */
export const sendPullCallback = async (
  eventName: DwhEventName,
  params: DwhPullParams,
  tx?: string
) => {
  if (!canSendPullCallback()) {
    console.warn(
      "[dwh] Bỏ qua phiếu: thiếu DWH_PUBLIC_BASE_URL, DWH_EXCHANGE_URL/SYSTEM_BASE_URL hoặc DWH_EXCHANGE_CLIENT_*",
      eventName,
      tx
    )
    return
  }
  const toAppCode = await resolveRequesterAppCode(tx)
  const body = buildPullCallbackBody(eventName, params, tx, toAppCode)
  for (let attempt = 0; ; attempt += 1) {
    await rateLimiter.acquire()
    const result = await postExchangeData(body)
    const trace = JSON.stringify({ tx, eventName, toAppCode, attempt, status: result.status })
    if (result.ok) {
      console.log("[dwh] Đã gửi phiếu", trace)
      return
    }
    const delayMs = RETRY_DELAYS_MS[attempt]
    if (!result.retryable || delayMs === undefined) {
      console.error("[dwh] Bỏ phiếu sau khi gửi thất bại", trace, result.body.slice(0, 500))
      return
    }
    console.warn("[dwh] Gửi phiếu lỗi, thử lại", trace, result.body.slice(0, 200))
    await Bun.sleep(delayMs)
  }
}
