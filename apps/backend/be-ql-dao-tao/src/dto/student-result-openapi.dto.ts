import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const CalculateSemesterResultResponseSchema = z.string().openapi({
  description: "Thông báo kết quả tính toán kết quả học kỳ cho toàn bộ học viên trong khóa.",
  example: "Successfully calculated semester results for all students.",
})

export const ClassDivisionStudentSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID học viên (Student).")),
    fixedClassId: z.string().openapi(fieldDesc("ID lớp niên chế đã gán.")),
    userProfileId: z.string().openapi(fieldDesc("ID hồ sơ người dùng.")),
    from: z.string().datetime().optional().openapi(fieldDesc("Ngày bắt đầu học tại lớp.")),
  })
  .openapi("ClassDivisionStudent")

export const ClassDivisionResultSchema = z
  .array(
    z.union([
      ClassDivisionStudentSchema,
      z.string().openapi(fieldDesc("Thông báo lỗi từng dòng (không tìm thấy lớp/HV).")),
    ])
  )
  .openapi("ClassDivisionResult")

export const VersionAppResponseSchema = z.record(z.string(), z.any()).openapi({
  description: "Payload phiên bản ứng dụng trả về từ API MTA (cấu trúc do dịch vụ MTA quy định).",
})

export const VersionAppErrorResponseSchema = z
  .object({
    message: z
      .union([z.string(), z.array(z.object({ message: z.string() }))])
      .openapi(fieldDesc("Chi tiết lỗi — chuỗi hoặc danh sách lỗi.")),
  })
  .openapi("VersionAppErrorResponse")
