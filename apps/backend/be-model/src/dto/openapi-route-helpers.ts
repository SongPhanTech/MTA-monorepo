import type { z } from "@hono/zod-openapi"
import {
  DocxBinaryResponseSchema,
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  UnauthorizedResponseSchema,
} from "./common-response.dto"

const JSON_CONTENT = "application/json" as const
const EXCEL_CONTENT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const
const DOCX_CONTENT =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const

type ZodSchema = z.ZodTypeAny

function jsonContent(schema: ZodSchema) {
  return { content: { [JSON_CONTENT]: { schema } } }
}

function excelContent(schema: ZodSchema = ExcelBinaryResponseSchema) {
  return { content: { [EXCEL_CONTENT]: { schema } } }
}

function docxContent(schema: ZodSchema = DocxBinaryResponseSchema) {
  return { content: { [DOCX_CONTENT]: { schema } } }
}

export function standardErrorResponses() {
  return {
    400: {
      description: "Dữ liệu không hợp lệ hoặc lỗi nghiệp vụ",
      ...jsonContent(ErrorMessageResponseSchema),
    },
    401: {
      description: "Chưa xác thực hoặc token không hợp lệ",
      ...jsonContent(UnauthorizedResponseSchema),
    },
    403: {
      description: "IP bị chặn",
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

export function jsonSuccess(schema: ZodSchema, description: string) {
  return {
    200: {
      description,
      ...jsonContent(schema),
    },
  }
}

export function excelSuccess(description: string, schema: ZodSchema = ExcelBinaryResponseSchema) {
  return {
    200: {
      description,
      ...excelContent(schema),
    },
  }
}

export function docxSuccess(description: string, schema: ZodSchema = DocxBinaryResponseSchema) {
  return {
    200: {
      description,
      ...docxContent(schema),
    },
  }
}
