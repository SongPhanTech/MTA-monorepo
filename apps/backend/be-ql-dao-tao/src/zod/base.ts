import { z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"

export const PaginationQuerySchema = z
  .object({
    page: z
      .number({ coerce: true })
      .min(1)
      .max(100)
      .optional()
      .openapi(fieldDesc("Số trang (phân trang, nếu API hỗ trợ).", 1)),
    limit: z
      .number({ coerce: true })
      .min(1)
      .max(100)
      .optional()
      .openapi(fieldDesc("Số bản ghi mỗi trang.", 20)),
  })
  .openapi("PaginationQuery")

export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema),
    count: z.number().openapi(fieldDesc("Tổng số bản ghi thỏa điều kiện.", 100)),
  }).openapi(`ListOf${itemSchema._def.openapi?._internal?.refId}`)
