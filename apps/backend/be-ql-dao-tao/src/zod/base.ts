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

/** @deprecated Dùng PaginatedDataResponseSchema cho response body — ListOf kế thừa query params page/limit. */
export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema),
    count: z.number().openapi(fieldDesc("Tổng số bản ghi thỏa điều kiện.", 100)),
  }).openapi(`ListOf${itemSchema._def.openapi?._internal?.refId}`)

export const PaginatedDataResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
      count: z.number().openapi(fieldDesc("Tổng số bản ghi thỏa điều kiện.", 100)),
    })
    .openapi(`PaginatedData${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)

export const DataSuccessResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
      success: z.literal(true).openapi(fieldDesc("true = thao tác thành công.", true)),
    })
    .openapi(`DataSuccess${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)

export const DataListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      data: z.array(itemSchema),
    })
    .openapi(`DataList${itemSchema._def.openapi?._internal?.refId ?? "Item"}`)
