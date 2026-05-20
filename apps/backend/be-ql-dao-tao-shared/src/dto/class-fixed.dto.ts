import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const GetClassRequest = z
  .object({
    key_word: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Từ khóa tìm kiếm theo tên lớp niên chế (FixedClass.name), không phân biệt hoa thường.",
          "CNPM"
        )
      ),
  })
  .openapi("GetClassRequest")

export const GetClassItem = z
  .object({
    class_code: z.string().openapi(fieldDesc("Mã lớp niên chế (FixedClass.code).", "D21CQCN01")),
    class_name: z.string().openapi(fieldDesc("Tên lớp niên chế (FixedClass.name).", "D21CQCN01")),
    major: z
      .string()
      .openapi(
        fieldDesc(
          "Tên phiên bản chương trình đào tạo (CurriculumVersion.name) gắn với lớp.",
          "CNTT 2021"
        )
      ),
    teacher: z
      .string()
      .openapi(
        fieldDesc(
          "Họ tên giảng viên chủ nhiệm / quản lý lớp (LecturerManagement → UserProfile.fullname).",
          "Nguyễn Văn A"
        )
      ),
    scholastic_name: z
      .string()
      .openapi(fieldDesc("Tên khóa học / niên khóa (TrainingCourse.name).", "K65")),
  })
  .openapi("GetClassItem")

export const GetClassResponse = SuccessResponseSchema.extend({
  data: z.array(GetClassItem).openapi(fieldDesc("Danh sách lớp niên chế (FixedClass).")),
}).openapi("GetClassResponse")
