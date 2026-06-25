import type { z } from "@hono/zod-openapi"
import {
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  ImportErrorResponseSchema,
  ImportJobResponseSchema,
} from "./common-response.dto"

const JSON_CONTENT = "application/json" as const
const EXCEL_CONTENT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const

type ZodSchema = z.ZodTypeAny

function jsonContent(schema: ZodSchema) {
  return { content: { [JSON_CONTENT]: { schema } } }
}

function excelContent(schema: ZodSchema = ExcelBinaryResponseSchema) {
  return { content: { [EXCEL_CONTENT]: { schema } } }
}

/** Phản hồi lỗi chuẩn: 400, 404, 409, 500. */
export function standardErrorResponses() {
  return {
    400: {
      description: "Dữ liệu không hợp lệ hoặc lỗi nghiệp vụ",
      ...jsonContent(ErrorMessageResponseSchema),
    },
    404: {
      description: "Không tìm thấy bản ghi",
      ...jsonContent(ErrorMessageResponseSchema),
    },
    409: {
      description: "Dữ liệu trùng (vi phạm ràng buộc unique)",
      ...jsonContent(ErrorMessageResponseSchema),
    },
    500: {
      description: "Lỗi máy chủ",
      ...jsonContent(ErrorMessageResponseSchema),
    },
  }
}

/** Phản hồi thành công JSON (HTTP 200). */
export function jsonSuccess(schema: ZodSchema, description: string) {
  return {
    200: {
      description,
      ...jsonContent(schema),
    },
  }
}

/** Phản hồi thành công file Excel (HTTP 200). */
export function excelSuccess(description: string, schema: ZodSchema = ExcelBinaryResponseSchema) {
  return {
    200: {
      description,
      ...excelContent(schema),
    },
  }
}

/** Phản hồi import: 200 thành công + 400 lỗi parse/file. */
export function importResponses() {
  return {
    ...jsonSuccess(ImportJobResponseSchema, "Import thành công"),
    400: {
      description: "File không hợp lệ hoặc lỗi parse Excel",
      ...jsonContent(ImportErrorResponseSchema),
    },
    ...standardErrorResponses(),
  }
}
