import { OpenAPIHono } from "@hono/zod-openapi"
import { DwhWebhookEventDataSchema } from "../dto/dwh"
import { loadEventData, parseDwhEventName } from "../dwh/events"
import { sendPullCallback } from "../dwh/exchange"
import {
  DWH_SECURITY_SCHEMES,
  dwhWebhookRoute,
  getDwhEventDataRoute,
  postDwhEventDataRoute,
} from "../dwh/routes"
import { hasValidDwhClient } from "../middlewares/dwh-auth"

/**
 * Tích hợp trục MTA-SSO (Pull 2 pha):
 *  ② trục POST /webhook {Tx, EventName, EventData} → trả {received} ngay
 *  ③ MTA gửi phiếu PullCallback {Endpoint, Method, Params} lên ESBs/exchange-data
 *  ④ trục gọi Endpoint = /events/{EventName} bằng x-clientid/x-clientsecret → trả dữ liệu
 */
const app = new OpenAPIHono({ strict: false })

for (const [name, scheme] of Object.entries(DWH_SECURITY_SCHEMES)) {
  app.openAPIRegistry.registerComponent("securitySchemes", name, scheme)
}

/** Sự kiện kiểm tra kết nối của trục: tài liệu ghi __connection_test__, nút test trên UI gửi TestConnection (không kèm khoá). */
const CONNECTION_TEST_EVENTS = new Set(["__connection_test__", "testconnection"])

const isConnectionTest = (eventName: unknown) =>
  typeof eventName === "string" && CONNECTION_TEST_EVENTS.has(eventName.trim().toLowerCase())

app.openapi(dwhWebhookRoute, async (c) => {
  const body = c.req.valid("json")
  const { EventName, EventData } = body
  const tx = body.tx ?? body.Tx
  console.log("[dwh] Webhook nhận", JSON.stringify({ tx, EventName, EventData }))

  if (isConnectionTest(EventName)) return c.json({ received: true }, 200)

  if (!hasValidDwhClient((name) => c.req.header(name))) {
    console.warn("[dwh] Webhook sai khoá xác thực", JSON.stringify({ tx, EventName }))
    return c.json({ received: false }, 200)
  }

  const eventName = parseDwhEventName(EventName)
  if (!eventName) {
    console.warn("[dwh] EventName không thuộc schema ql-dao-tao, không gửi phiếu", EventName)
    return c.json({ received: true }, 200)
  }
  if (!tx) console.warn("[dwh] Webhook thiếu Tx", eventName)

  const eventData = DwhWebhookEventDataSchema.safeParse(EventData ?? {})
  if (!eventData.success) {
    console.warn("[dwh] EventData không hợp lệ, lấy từ đầu", EventData, eventData.error.issues)
  }
  // Trả lời trục ngay, gửi phiếu ở nền.
  void sendPullCallback(eventName, eventData.success ? eventData.data : {}, tx).catch((error) =>
    console.error("[dwh] Lỗi gửi phiếu", eventName, tx, error)
  )
  return c.json({ received: true }, 200)
})

app.openapi(postDwhEventDataRoute, async (c) => {
  const { eventName } = c.req.valid("param")
  return c.json(await loadEventData(eventName, c.req.valid("json")), 200)
})

app.openapi(getDwhEventDataRoute, async (c) => {
  const { eventName } = c.req.valid("param")
  return c.json(await loadEventData(eventName, c.req.valid("query")), 200)
})

export default app
