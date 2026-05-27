import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"

export const PaginationQuerySchema = z
  .object({
    page: z
      .number({ coerce: true })
      .optional()
      .openapi(fieldDesc("Số trang (phân trang, nếu API hỗ trợ).", 1)),
    limit: z.number({ coerce: true }).optional().openapi(fieldDesc("Số bản ghi mỗi trang.", 20)),
  })
  .openapi("PaginationQuery")

export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema).openapi(fieldDesc("Danh sách bản ghi trang hiện tại.")),
    count: z.number().openapi(fieldDesc("Tổng số bản ghi thỏa điều kiện.", 100)),
  }).openapi(`ListOf${itemSchema._def.openapi?._internal?.refId}`)

export const SuccessResponseSchema = z
  .object({
    result_code: z.enum(["000"]).openapi(API_RESULT.SUCCESS_CODE),
    result_desc: z.enum(["success"]).openapi(API_RESULT.SUCCESS_DESC),
  })
  .openapi("SuccessResponse")

export enum ErrorCode {
  SESSION_NOT_FOUND = "401",
  STUDENT_NOT_FOUND = "411",
  STUDENT_NO_CLASS = "412",
  CURRICULUM_NOT_FOUND = "421",
  CLASS_NOT_FOUND = "431",
}

export const FailedResponseSchema = z
  .object({
    result_code: z.nativeEnum(ErrorCode).openapi(API_RESULT.ERROR_CODE),
    result_desc: z.string().openapi(API_RESULT.ERROR_DESC),
  })
  .openapi("FailedResponse")
