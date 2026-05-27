import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const GetSemesterRequest = z
  .object({
    year: z
      .string()
      .optional()
      .openapi(
        fieldDesc("Từ khóa lọc năm học theo tên (SchoolYear.name), không bắt buộc.", "2025-2026")
      ),
  })
  .openapi("GetSemesterRequest")

export const GetSemesterItem = z
  .object({
    year_code: z.string().openapi(fieldDesc("Mã năm học (SchoolYear.code).", "2025-2026")),
    year_name: z.string().openapi(fieldDesc("Tên năm học (SchoolYear.name).", "2025-2026")),
    class_terms: z.string().openapi(fieldDesc("Tên học kỳ (Semester.name).", "2025-2026 HK1")),
    class_terms_code: z.string().openapi(fieldDesc("Mã học kỳ (Semester.code).", "080")),
  })
  .openapi("GetSemesterItem")

export const GetSemesterResponse = SuccessResponseSchema.extend({
  data: z
    .array(GetSemesterItem)
    .openapi(fieldDesc("Danh sách học kỳ theo năm học (SchoolYear → Semester).")),
}).openapi("GetSemesterResponse")

export const GetAllYearItem = z
  .object({
    year_code: z.string().openapi(fieldDesc("Mã năm học (SchoolYear.code).", "2025-2026")),
    year: z.string().openapi(fieldDesc("Tên năm học (SchoolYear.name).", "2025-2026")),
  })
  .openapi("GetAllYearItem")

export const GetAllYearResponse = SuccessResponseSchema.extend({
  data: z.array(GetAllYearItem).openapi(fieldDesc("Danh sách tất cả năm học (SchoolYear).")),
}).openapi("GetAllYearResponse")
