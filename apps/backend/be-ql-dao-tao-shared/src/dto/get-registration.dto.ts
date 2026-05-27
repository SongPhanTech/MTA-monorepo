import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const GetRegistrationRequest = z
  .object({
    class_terms: z
      .string()
      .openapi(
        fieldDesc(
          "Tên học kỳ / kỳ đăng ký (Semester.name), dùng để lọc đợt đăng ký (ClassRegisterSession).",
          "2025-2026 HK1"
        )
      ),
    students_code: z.string().openapi(fieldDesc("Mã sinh viên (Student.code).", "21000001")),
  })
  .openapi("GetRegistrationRequest")

export const GetRegistrationResponse = SuccessResponseSchema.extend({
  students_code: z.string().openapi(fieldDesc("Mã sinh viên đã tra cứu.", "21000001")),
  class_reg: z
    .array(z.string())
    .openapi(
      fieldDesc(
        "Danh sách mã lớp học phần đã đăng ký (SubjectClass.code) trong học kỳ class_terms."
      )
    ),
}).openapi("GetRegistrationResponse")

export const GetRegistrationErrorResponse = z
  .object({
    result_code: z.string().openapi(API_RESULT.ERROR_CODE),
    result_desc: z.string().openapi(API_RESULT.ERROR_DESC),
  })
  .openapi("GetRegistrationErrorResponse")
