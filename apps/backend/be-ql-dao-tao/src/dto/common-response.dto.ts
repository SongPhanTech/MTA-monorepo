import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const SuccessBooleanResponseSchema = z
  .object({
    success: z.boolean().openapi(fieldDesc("true = thao tác thành công.", true)),
    message: z.string().openapi(fieldDesc("Thông báo kết quả.", "Success")),
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

export const CountOnlyResponseSchema = z
  .object({
    count: z.number().openapi(fieldDesc("Số bản ghi đã xử lý / tạo.")),
  })
  .openapi("CountOnlyResponse")

export const CountMessageResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo kết quả xử lý.")),
    count: z.number().openapi(fieldDesc("Số bản ghi đã cập nhật / xử lý.")),
  })
  .openapi("CountMessageResponse")

export const ErrorDetailResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo lỗi.")),
    error: z.string().optional().openapi(fieldDesc("Chi tiết lỗi kỹ thuật (nếu có).")),
  })
  .openapi("ErrorDetailResponse")

export const PlanTrainingImportResultSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo kết quả import.")),
    time: z.number().openapi(fieldDesc("Thời gian xử lý (ms).")),
    error: z
      .array(
        z.object({
          message: z.string().openapi(fieldDesc("Mô tả lỗi từng dòng / bản ghi.")),
        })
      )
      .openapi(fieldDesc("Danh sách lỗi chi tiết (có thể rỗng).")),
  })
  .openapi("PlanTrainingImportResult")

export const ImportJobResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo kết quả import.")),
    time: z.number().openapi(fieldDesc("Thời gian xử lý (ms).")),
  })
  .openapi("ImportJobResponse")

export const ImportErrorResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo lỗi tổng quát.")),
    errors: z.array(z.any()).optional().openapi(fieldDesc("Chi tiết lỗi từng dòng (parse Excel).")),
  })
  .openapi("ImportErrorResponse")

/** Dùng khi errors là kết quả zParseSheetError từ parse Excel CTĐT. */
export const SheetParseErrorResponseSchema = <T extends z.ZodTypeAny>(errorItemSchema: T) =>
  z.object({
    message: z.string().openapi(fieldDesc("Thông báo lỗi tổng quát.")),
    errors: z
      .array(errorItemSchema)
      .optional()
      .openapi(fieldDesc("Lỗi từng dòng / ô trên file Excel.")),
  })

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
