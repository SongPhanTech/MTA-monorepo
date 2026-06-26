import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const SuccessBooleanResponseSchema = z
  .object({
    success: z.boolean().openapi(fieldDesc("true = thao tác thành công.", true)),
  })
  .openapi("SuccessBooleanResponse")

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

export const UnauthorizedResponseSchema = z
  .object({
    error: z.string().openapi(fieldDesc("Thông báo lỗi xác thực.", "Unauthorized")),
  })
  .openapi("UnauthorizedResponse")

export const OkBooleanResponseSchema = z
  .object({
    ok: z.boolean().openapi(fieldDesc("true = thao tác thành công.", true)),
  })
  .openapi("OkBooleanResponse")

export const TemplatePreviewResponseSchema = z
  .object({
    path: z.string().openapi(fieldDesc("Đường dẫn object trên MinIO.")),
    fileType: z.string().openapi(fieldDesc("Loại file (xlsx, docx).", "xlsx")),
  })
  .openapi("TemplatePreviewResponse")

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
