import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const TYPE_RES = {
  REGISTER: "R",
  CANCEL: "C",
} as const

export const RegistrationRequest = z
  .object({
    students_code: z.string().openapi(fieldDesc("Mã sinh viên (Student.code).", "21000001")),
    class_data: z
      .array(z.string())
      .openapi(fieldDesc("Danh sách ID lớp học phần (SubjectClass.id) cần đăng ký hoặc hủy.")),
    type_res: z
      .nativeEnum(TYPE_RES)
      .openapi(fieldDesc("Loại thao tác: R = đăng ký; C = hủy đăng ký.")),
  })
  .openapi("RegistrationRequest")

export const RegistrationResponse = SuccessResponseSchema.extend({
  students_code: z
    .string()
    .openapi(fieldDesc("Mã sinh viên đã thực hiện đăng ký / hủy.", "21000001")),
  class_valid: z
    .array(z.string())
    .openapi(fieldDesc("ID lớp học phần xử lý thành công (SubjectClass.id).")),
  class_invalid: z
    .array(z.string())
    .openapi(fieldDesc("ID lớp học phần xử lý thất bại (SubjectClass.id).")),
  invalid_desc: z
    .string()
    .openapi(fieldDesc("Mô tả lỗi gộp cho các lớp trong class_invalid.", "Lớp đã đủ số lượng")),
}).openapi("RegistrationResponse")
