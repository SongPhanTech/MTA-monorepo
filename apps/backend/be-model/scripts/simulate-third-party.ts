/**
 * Giả lập BÊN THỨ BA lấy dữ liệu đào tạo qua trục (luồng Pull 2 pha thật trên MTA-SSO).
 *   bun scripts/simulate-third-party.ts <EventName> [limit]
 *   vd: bun scripts/simulate-third-party.ts Semester 5
 *
 * Script chỉ gọi trục (giống hệt bên thứ ba), không gọi thẳng MTA:
 *   1. GET  /sync/events               — xem catalog sự kiện, đã được cấp quyền chưa
 *   2. POST /ESBs/exchange-data        — gửi PullRequest, nhận Tx
 *   3. GET  /sync/pull/{tx}/status     — theo dõi tới delivered / failed
 * Dữ liệu được trục giao tới Endpoint của route (MTA → bên thứ ba) đã đăng ký trên trục.
 *
 * Biến môi trường (khoá do trục cấp cho bên thứ ba, KHÔNG phải khoá của MTA):
 *   THIRD_PARTY_APP_CODE, THIRD_PARTY_CLIENT_ID, THIRD_PARTY_CLIENT_SECRET
 *   MTA_APP_CODE        mã ứng dụng MTA trên trục (mặc định Lms)
 *   TRUC_BASE_URL       mặc định https://daotao.swantech.vn/api/system/sync
 *   TRUC_TENANT_CODE    mặc định default
 */
const [eventName = "Semester", limitArg = "5"] = process.argv.slice(2)
const trucBaseUrl = (process.env.TRUC_BASE_URL || "https://daotao.swantech.vn/api/system/sync").replace(/\/+$/, "")
const fromAppCode = process.env.THIRD_PARTY_APP_CODE || ""
const toAppCode = process.env.MTA_APP_CODE || "Lms"
const tenantCode = process.env.TRUC_TENANT_CODE || "default"
const headers = {
  "Content-Type": "application/json",
  "x-clientid": process.env.THIRD_PARTY_CLIENT_ID || "",
  "x-clientsecret": process.env.THIRD_PARTY_CLIENT_SECRET || "",
}

if (!fromAppCode || !headers["x-clientid"] || !headers["x-clientsecret"]) {
  console.error("Thiếu THIRD_PARTY_APP_CODE / THIRD_PARTY_CLIENT_ID / THIRD_PARTY_CLIENT_SECRET")
  process.exit(1)
}

const call = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(`${trucBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let data: unknown = text
  try {
    data = JSON.parse(text)
  } catch {}
  return { status: response.status, data }
}

const short = (value: unknown, max = 600) => {
  const text = typeof value === "string" ? value : JSON.stringify(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

console.log(`Trục: ${trucBaseUrl} | ${fromAppCode} → lấy ${eventName} của ${toAppCode}\n`)

// 1. Catalog sự kiện
const events = await call("GET", `/sync/events?appCode=${encodeURIComponent(toAppCode)}`)
if (events.status === 200 && Array.isArray(events.data)) {
  // Trục trả khoá PascalCase (EventName, IsGranted); đọc cả hai kiểu cho chắc.
  const items = events.data as Record<string, unknown>[]
  const pick = (item: Record<string, unknown>, key: string) =>
    item[key] ?? item[key.charAt(0).toUpperCase() + key.slice(1)]
  const found = items.find(
    (item) => String(pick(item, "eventName") ?? "").toUpperCase() === eventName.toUpperCase()
  )
  console.log(
    `① Catalog: ${items.length} sự kiện; ${eventName}:`,
    found ? `có (isGranted=${pick(found, "isGranted")})` : "KHÔNG có trong catalog"
  )
} else {
  console.log("① Catalog:", events.status, short(events.data, 200))
}

// 2. PullRequest
const pull = await call("POST", "/ESBs/exchange-data", {
  fromAppCode,
  toAppCode,
  businessType: eventName,
  actionType: "PullRequest",
  tenantCode,
  message: JSON.stringify({ limit: Number(limitArg), cursor: null }),
})
console.log("② PullRequest:", pull.status, short(pull.data, 200))
if (pull.status !== 200) process.exit(1)
const tx = typeof pull.data === "string" ? pull.data : String((pull.data as { tx?: string }).tx ?? pull.data)

// 3. Theo dõi trạng thái
const TERMINAL = /delivered|failed/i
let last = ""
for (let attempt = 1; attempt <= 30; attempt += 1) {
  await Bun.sleep(2000)
  const status = await call("GET", `/sync/pull/${encodeURIComponent(tx)}/status`)
  const text = short(status.data)
  if (text !== last) {
    console.log(`③ [${attempt * 2}s] ${status.status} ${text}`)
    last = text
  }
  if (TERMINAL.test(text) || status.status >= 400) break
}
console.log(`\nTx = ${tx}  (tra lại: GET ${trucBaseUrl}/sync/pull/${tx}/status)`)
