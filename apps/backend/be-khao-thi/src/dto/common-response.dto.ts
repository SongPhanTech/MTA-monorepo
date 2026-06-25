import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const SuccessBooleanResponseSchema = z
  .object({
    success: z.boolean().openapi(fieldDesc("true = thao tác thành công.", true)),
    message: z.string().openapi(fieldDesc("Thông báo kết quả.", "Success")),
  })
  .openapi("SuccessBooleanResponse")

export const FailureBooleanResponseSchema = z
  .object({
    success: z.boolean().openapi(fieldDesc("false = thao tác thất bại.", false)),
    message: z.string().openapi(fieldDesc("Mô tả lỗi bằng tiếng Việt.")),
  })
  .openapi("FailureBooleanResponse")

export const SuccessMessageResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo kết quả thành công.")),
  })
  .openapi("SuccessMessageResponse")

export const ErrorMessageResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Mô tả lỗi bằng tiếng Việt.")),
  })
  .openapi("ErrorMessageResponse")

export const ExcelBinaryResponseSchema = z.string().openapi({
  type: "string",
  format: "binary",
  description: "File Excel (.xlsx) — tải về qua header Content-Disposition.",
})

export const DocxBinaryResponseSchema = z.string().openapi({
  type: "string",
  format: "binary",
  description: "File Word (.docx) — tải về qua header Content-Disposition.",
})
