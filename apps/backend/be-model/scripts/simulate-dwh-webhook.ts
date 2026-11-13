/**
 * Giả lập trục gọi be-model đang chạy (chỉ gọi HTTP, không import app, không ghi DB).
 *
 *   bun scripts/simulate-dwh-webhook.ts <EventName> [limit] [maxPages]
 *   vd: bun scripts/simulate-dwh-webhook.ts Lecturer 5 2
 *
 * Biến môi trường:
 *   DWH_TEST_BASE_URL  route /api/dwh của be-model, mặc định http://localhost:3000/api/dwh
 *   DWH_CLIENT_ID / DWH_CLIENT_SECRET  khoá trục gọi vào MTA (đọc từ .env)
 *   DWH_TEST_WEBHOOK=1  gọi thêm webhook (be-model sẽ gửi phiếu thật lên trục nếu đã cấu hình)
 */
const [eventName = "Lecturer", limitArg = "5", maxPagesArg = "2"] = process.argv.slice(2)
const baseUrl = (process.env.DWH_TEST_BASE_URL || "http://localhost:3000/api/dwh").replace(/\/+$/, "")
const headers = {
  "Content-Type": "application/json",
  "x-clientid": process.env.DWH_CLIENT_ID || "",
  "x-clientsecret": process.env.DWH_CLIENT_SECRET || "",
}

const post = async (path: string, body: unknown) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const text = await response.text()
  try {
    return { status: response.status, body: JSON.parse(text) }
  } catch {
    return { status: response.status, body: text }
  }
}

const test = await post("/webhook", { Tx: crypto.randomUUID(), EventName: "__connection_test__", EventData: "[]" })
console.log("① test kết nối:", test.status, test.body)

if (process.env.DWH_TEST_WEBHOOK === "1") {
  const tx = crypto.randomUUID()
  const webhook = await post("/webhook", {
    Tx: tx,
    EventName: eventName,
    EventData: JSON.stringify({ limit: Number(limitArg) }),
  })
  console.log("② webhook:", webhook.status, webhook.body, "tx =", tx)
}

let cursor: string | undefined
for (let page = 1; page <= Number(maxPagesArg); page += 1) {
  const result = await post(`/events/${eventName}`, { limit: Number(limitArg), cursor })
  if (result.status !== 200) {
    console.error(`④ trang ${page}:`, result.status, result.body)
    break
  }
  const { totalRecords, hasMore, nextCursor, data } = result.body
  console.log(`④ trang ${page}: ${data.length} bản ghi, totalRecords=${totalRecords}, hasMore=${hasMore}`)
  if (page === 1 && data[0]) console.log("   bản ghi đầu:", JSON.stringify(data[0]).slice(0, 300))
  if (!hasMore) break
  cursor = nextCursor
}
