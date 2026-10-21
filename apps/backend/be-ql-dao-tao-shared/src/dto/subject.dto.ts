import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const GetListSubjectRequest = z
  .object({
    key_word: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Từ khóa lọc môn học theo mã hoặc tên (SubjectVersion.code, SubjectVersion.name).",
          "TOAN"
        )
      ),
  })
  .openapi("GetListSubjectRequest")

export const GetListSubjectItem = z
  .object({
    subject_code: z
      .string()
      .nullish()
      .openapi(fieldDesc("Mã học phần / phiên bản môn (SubjectVersion.code).", "TIN001")),
    subject_name: z
      .string()
      .openapi(fieldDesc("Tên học phần (SubjectVersion.name).", "Tin học đại cương")),
    courser: z.number().nullish().openapi(fieldDesc("Số tiết học (SubjectVersion.period).", 45)),
    class_credit_hour: z.number().openapi(fieldDesc("Số tín chỉ (SubjectVersion.credit).", 3)),
    dvht: z.number().openapi(fieldDesc("Đơn vị học trình ≈ period / 15 (quy đổi nội bộ).", 3)),
    description: z
      .string()
      .openapi(
        fieldDesc(
          "Hình thức thi (SubjectVersion.examType): Thi viết, Trực tuyến, Vấn đáp, Thực hành, Đồ án, Trắc nghiệm, Bài tập TH, Bảo vệ đồ án, Báo cáo, Nghe nói đọc viết, Đọc viết, Nghe nói, Nghe đọc viết, Chưa xác định, Hình thức khác.",
          "Thi viết"
        )
      ),
  })
  .openapi("GetListSubjectItem")

export const GetListSubjectResponse = SuccessResponseSchema.extend({
  data: z.array(GetListSubjectItem).openapi(fieldDesc("Danh sách học phần (SubjectVersion).")),
}).openapi("GetListSubjectResponse")
