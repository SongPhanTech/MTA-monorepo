import { z } from "@hono/zod-openapi"

export const PaginationQuerySchema = z
  .object({
    page: z.number({ coerce: true }).min(1).max(100).optional(),
    limit: z.number({ coerce: true }).min(1).max(100).optional(),
  })
  .openapi("PaginationQuery")

/** Query param array: 1 giá trị đến dạng string, nhiều giá trị dạng string[]. */
export const QueryStringArraySchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (val === undefined || val === "") return undefined
    return Array.isArray(val) ? val : [val]
  })

/** Query param boolean: nhận boolean hoặc string ("true", "false", "1", "0") hoặc mảng string. */
export const QueryBooleanSchema = z
  .union([z.boolean(), z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (val === undefined || val === "" || val === null || val === "null") return undefined
    if (typeof val === "boolean") return val
    if (Array.isArray(val)) {
      if (val.length === 1) {
        if (val[0] === "true" || val[0] === "1") return true
        if (val[0] === "false" || val[0] === "0") return false
      }
      return undefined
    }
    if (val === "true" || val === "1") return true
    if (val === "false" || val === "0") return false
    return undefined
  })
  .openapi({ type: "boolean" })

/** @deprecated Dùng PaginatedDataResponseSchema cho response body — ListOf kế thừa query params page/limit. */
export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema),
    count: z.number(),
  }).openapi(`ListOf${itemSchema._def.openapi?._internal?.refId}`)

export const PaginatedDataResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
      count: z.number(),
    })
    .openapi(`PaginatedData${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)

export const DataSuccessResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
      success: z.literal(true),
    })
    .openapi(`DataSuccess${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)

export const PaginatedTotalResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
      total: z.number(),
    })
    .openapi(`PaginatedTotal${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)
