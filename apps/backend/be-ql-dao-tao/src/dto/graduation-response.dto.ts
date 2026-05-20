import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const GraduationConflictResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo lỗi xung đột dữ liệu.")),
    existing: z
      .array(z.string())
      .optional()
      .openapi(fieldDesc("Danh sách mã / ID đã tồn tại.")),
    shouldSkip: z
      .array(z.number())
      .optional()
      .openapi(fieldDesc("Chỉ số dòng Excel nên bỏ qua khi import.")),
  })
  .openapi("GraduationConflictResponse")

export const GraduationClassificationCountSchema = z
  .object({
    count: z.number().openapi(fieldDesc("Số học viên trong nhóm xếp loại.")),
    year: z.number().openapi(fieldDesc("Năm tốt nghiệp.")),
    classification: z.string().openapi(fieldDesc("Xếp loại tốt nghiệp (Giỏi, Khá, …).")),
  })
  .openapi("GraduationClassificationCount")

export const PptxBinaryResponseSchema = z
  .string()
  .openapi({
    type: "string",
    format: "binary",
    description: "File PowerPoint (.pptx) — tải về qua header Content-Disposition.",
  })
