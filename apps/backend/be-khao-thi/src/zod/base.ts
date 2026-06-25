import { z } from "@hono/zod-openapi"

export const PaginationQuerySchema = z
  .object({
    page: z.number({ coerce: true }).min(1).max(100).optional(),
    limit: z.number({ coerce: true }).min(1).max(100).optional(),
  })
  .openapi("PaginationQuery")

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
