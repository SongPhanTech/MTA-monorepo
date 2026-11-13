import { z } from "@hono/zod-openapi"
import { MAX_BATCH_SIZE } from "../dwh/config"
import { DWH_EVENT_NAMES } from "../dwh/event-names"

export const DwhEventNameSchema = z
  .enum(DWH_EVENT_NAMES)
  .openapi({ description: "Tên event = tên bảng thuộc schema ql-dao-tao.", example: "Lecturer" })

export const DwhEventParamsSchema = z.object({
  eventName: DwhEventNameSchema.openapi({ param: { name: "eventName", in: "path" } }),
})

const ID_DESCRIPTION =
  "Id bản ghi. Truyền id = lấy đúng 1 bản ghi; bỏ trống = lấy toàn bộ bảng theo lô."
const LIMIT_DESCRIPTION = `Số bản ghi tối đa mỗi lần (1–${MAX_BATCH_SIZE}). Bỏ qua khi có id.`
const CURSOR_DESCRIPTION =
  "Giá trị nextCursor của lần gọi trước. Bỏ trống = lấy từ đầu. Lưu nextCursor cuối cùng để lần sau chỉ lấy phần thay đổi. Bỏ qua khi có id."

const limitSchema = z.number().int().min(1).max(MAX_BATCH_SIZE)

export const DwhEventQuerySchema = z.object({
  id: z
    .string()
    .min(1)
    .optional()
    .openapi({ param: { name: "id", in: "query" }, description: ID_DESCRIPTION }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_BATCH_SIZE)
    .default(MAX_BATCH_SIZE)
    .openapi({ param: { name: "limit", in: "query" }, description: LIMIT_DESCRIPTION }),
  cursor: z
    .string()
    .optional()
    .openapi({ param: { name: "cursor", in: "query" }, description: CURSOR_DESCRIPTION }),
})

// Nhận cả null (vd dữ liệu mẫu {"limit": 200, "cursor": null}) = như bỏ trống.
const eventRequestShape = {
  id: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value ?? undefined)
    .openapi({ description: ID_DESCRIPTION }),
  cursor: z
    .string()
    .nullish()
    .transform((value) => value || undefined)
    .openapi({ description: CURSOR_DESCRIPTION }),
}

export const DwhEventBodySchema = z
  .object({
    ...eventRequestShape,
    limit: limitSchema.default(MAX_BATCH_SIZE).openapi({ description: LIMIT_DESCRIPTION }),
  })
  .openapi("DwhEventBody")

/** Trục gửi EventData dạng chuỗi JSON, đôi khi là object. */
const parseJsonString = (value: unknown) => {
  if (typeof value !== "string") return value
  if (!value.trim()) return {}
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const DwhWebhookEventDataSchema = z.preprocess(
  parseJsonString,
  z.object({ ...eventRequestShape, limit: limitSchema.optional() })
)

const DwhTransactionIdSchema = z.union([z.string(), z.number()]).openapi("DwhTransactionId", {
  description: "Mã giao dịch của trục, gửi lại kèm phiếu PullCallback. Nhận cả khoá tx và Tx.",
})

export const DwhWebhookBodySchema = z
  .object({
    tx: DwhTransactionIdSchema.transform(String).optional(),
    Tx: DwhTransactionIdSchema.transform(String).optional(),
    EventName: z.string().optional().openapi({
      description:
        "Tên bảng thuộc schema ql-dao-tao (không phân biệt hoa thường), hoặc __connection_test__ khi trục kiểm tra kết nối.",
      example: "Lecturer",
    }),
    EventData: z.unknown().optional().openapi({
      description: 'Chuỗi JSON hoặc object: {} | {"id":"..."} | {"limit":200,"cursor":"..."}',
    }),
  })
  .openapi("DwhWebhookBody")

export const DwhWebhookResponseSchema = z
  .object({ received: z.boolean() })
  .openapi("DwhWebhookResponse")

export const DwhEventResponseSchema = z
  .object({
    entityName: DwhEventNameSchema,
    action: z.literal("upsert"),
    source: z.string().openapi({ description: "Mã ứng dụng MTA trên trục." }),
    syncedAt: z.string().openapi({ description: "Thời điểm lấy dữ liệu, ISO-8601 UTC." }),
    totalRecords: z.number().int().openapi({
      description: "Số bản ghi còn lại tính từ cursor (gồm cả lô này); 1 khi lấy theo id.",
    }),
    hasMore: z.boolean().openapi({ description: "true = còn dữ liệu, gọi tiếp với nextCursor." }),
    nextCursor: z.string().nullable().openapi({
      description:
        "Truyền vào cursor ở lần gọi sau. Lô rỗng thì trả lại cursor đã truyền; null khi chưa có dữ liệu.",
    }),
    data: z.array(z.record(z.string(), z.unknown())).openapi({
      description: "Bản ghi chưa xoá mềm, đủ mọi cột của bảng (không gồm quan hệ).",
    }),
  })
  .openapi("DwhEventResponse")

export const DwhMessageSchema = z.object({ message: z.string() }).openapi("DwhMessage")
