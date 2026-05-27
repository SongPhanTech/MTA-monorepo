import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const GetListTeacherRequest = z
  .object({
    key_word: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Từ khóa tìm theo họ đệm / tên (UserProfile.lastName), không phân biệt hoa thường.",
          "Nguyễn"
        )
      ),
  })
  .openapi("GetListTeacherRequest")

export const TeacherListItem = z
  .object({
    teacher_code: z
      .string()
      .nullish()
      .openapi(fieldDesc("Mã giảng viên (Lecturer.code).", "GV001")),
    teacher: z.string().openapi(fieldDesc("Họ tên đầy đủ (UserProfile.fullname).", "Nguyễn Văn A")),
    department_code: z
      .string()
      .nullish()
      .openapi(fieldDesc("Mã đơn vị công tác (Organization.sMa).", "K_CNTT")),
    department_name: z
      .string()
      .openapi(fieldDesc("Tên đơn vị công tác (Organization.sTen).", "Khoa CNTT")),
    rank_name: z.string().openapi(fieldDesc("Quân hàm / cấp bậc (DM_QuanHam.sTen).", "Thượng tá")),
    position_name: z
      .string()
      .openapi(fieldDesc("Chức vụ Đảng / chức danh (DM_ChucVu.sTen).", "Giảng viên")),
    phone_number: z
      .string()
      .openapi(fieldDesc("Số điện thoại (UserProfile.phoneNumber).", "0901234567")),
    working_number: z
      .string()
      .openapi(fieldDesc("Số điện thoại công tác (trùng phoneNumber).", "0901234567")),
    working_mail: z
      .string()
      .openapi(fieldDesc("Email công tác (UserProfile.email).", "gv@mta.edu.vn")),
  })
  .openapi("TeacherListItem")

export const GetListTeacherResponse = SuccessResponseSchema.extend({
  data: z.array(TeacherListItem).openapi(fieldDesc("Danh sách giảng viên thỏa từ khóa tìm kiếm.")),
}).openapi("GetListTeacherResponse")

export const GetTeacherDetailRequest = z
  .object({
    teacher_code: z
      .string()
      .openapi(fieldDesc("Mã giảng viên cần tra cứu (Lecturer.code).", "GV001")),
  })
  .openapi("GetTeacherDetailRequest")

export const GetTeacherDetailResponse = SuccessResponseSchema.extend({
  teacher_code: z.string().nullable().openapi(fieldDesc("Mã giảng viên.", "GV001")),
  teacher: z.string().openapi(fieldDesc("Họ tên (lastName + firstName).", "Nguyễn Văn A")),
  department_code: z.string().nullable().openapi(fieldDesc("Mã đơn vị.", "K_CNTT")),
  department_name: z.string().openapi(fieldDesc("Tên đơn vị.", "Khoa CNTT")),
  rank_name: z.string().openapi(fieldDesc("Quân hàm.", "Thượng tá")),
  position_name: z.string().openapi(fieldDesc("Chức vụ.", "Giảng viên")),
  phone_number: z.string().openapi(fieldDesc("Số điện thoại.", "0901234567")),
  working_phone: z.string().openapi(fieldDesc("Số điện thoại công tác.", "0901234567")),
  working_mail: z.string().openapi(fieldDesc("Email.", "gv@mta.edu.vn")),
}).openapi("GetTeacherDetailResponse")
