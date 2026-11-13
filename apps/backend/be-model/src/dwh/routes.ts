import { createRoute } from "@hono/zod-openapi"
import {
  DwhEventBodySchema,
  DwhEventParamsSchema,
  DwhEventQuerySchema,
  DwhEventResponseSchema,
  DwhMessageSchema,
  DwhWebhookBodySchema,
  DwhWebhookResponseSchema,
} from "../dto/dwh"

/**
 * Khai báo route DWH, tách khỏi handler để xuất Swagger mà không cần import Prisma/server
 * (scripts/export-dwh-openapi.ts).
 */

export const DWH_SECURITY_SCHEMES = {
  ClientId: { type: "apiKey", in: "header", name: "x-clientid" },
  ClientSecret: { type: "apiKey", in: "header", name: "x-clientsecret" },
} as const

const security = [{ ClientId: [], ClientSecret: [] }]

const messageContent = { "application/json": { schema: DwhMessageSchema } }

const eventDataResponses = {
  200: {
    description:
      "Dữ liệu dạng { entityName, action, source, syncedAt, totalRecords, hasMore, nextCursor, data }",
    content: { "application/json": { schema: DwhEventResponseSchema } },
  },
  400: { description: "Tên event, limit hoặc cursor không hợp lệ", content: messageContent },
  401: { description: "Thiếu hoặc sai x-clientid/x-clientsecret", content: messageContent },
  404: { description: "Không tìm thấy bản ghi theo id", content: messageContent },
  503: { description: "Đang quá tải, gọi lại sau Retry-After giây", content: messageContent },
}

export const dwhWebhookRoute = createRoute({
  operationId: "dwhWebhook",
  tags: ["DWH"],
  summary: "Webhook nhận yêu cầu lấy dữ liệu từ trục, đẩy phiếu PullCallback lên exchange-data",
  description:
    "Trục gọi khi có bên yêu cầu dữ liệu (Pull pha 1). Luôn trả 200 ngay: received=false khi sai khoá; " +
    "received=true thì MTA gửi phiếu PullCallback {Endpoint, Method, Params} kèm cùng Tx lên ESBs/exchange-data, " +
    "trục gọi lại Endpoint = /api/dwh/events/{EventName} để lấy dữ liệu. EventName=__connection_test__ hoặc TestConnection (kiểm tra kết nối) chỉ trả 200, không cần khoá.",
  method: "post",
  path: "/webhook",
  security,
  request: { body: { content: { "application/json": { schema: DwhWebhookBodySchema } } } },
  responses: {
    200: {
      description: "Đã nhận yêu cầu",
      content: { "application/json": { schema: DwhWebhookResponseSchema } },
    },
  },
})

export const postDwhEventDataRoute = createRoute({
  operationId: "postDwhEventData",
  tags: ["DWH"],
  summary: "Lấy dữ liệu một bảng ql-dao-tao: có id = 1 bản ghi, không id = theo lô với cursor",
  method: "post",
  path: "/events/{eventName}",
  security,
  request: {
    params: DwhEventParamsSchema,
    body: { content: { "application/json": { schema: DwhEventBodySchema } } },
  },
  responses: eventDataResponses,
})

export const getDwhEventDataRoute = createRoute({
  operationId: "getDwhEventData",
  tags: ["DWH"],
  summary: "Lấy dữ liệu một bảng ql-dao-tao: có id = 1 bản ghi, không id = theo lô với cursor",
  method: "get",
  path: "/events/{eventName}",
  security,
  request: { params: DwhEventParamsSchema, query: DwhEventQuerySchema },
  responses: eventDataResponses,
})
