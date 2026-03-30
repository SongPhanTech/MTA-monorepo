import { z } from "@hono/zod-openapi"

export const PaginationQuerySchema = z
  .object({
    page: z.number({ coerce: true }).optional(),
    limit: z.number({ coerce: true }).optional(),
  })
  .openapi("PaginationQuery")

export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema),
    count: z.number(),
  }).openapi(`ListOf${itemSchema._def.openapi?._internal?.refId}`)

export const SuccessResponseSchema = z
  .object({
    result_code: z.enum(["000"]),
    result_desc: z.enum(["success"]),
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
    result_code: z.nativeEnum(ErrorCode),
    result_desc: z.string(),
  })
  .openapi("FailedResponse")
