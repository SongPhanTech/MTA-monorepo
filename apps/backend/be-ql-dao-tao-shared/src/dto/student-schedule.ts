import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const StudentScheduleRequest = z
  .object({
    class_terms: z
      .string()
      .openapi(fieldDesc("Tên học kỳ (Semester.name) cần xem TKB.", "2025-2026 HK1")),
    students_code: z.string().openapi(fieldDesc("Mã sinh viên (UserProfile.code).", "21000001")),
  })
  .openapi("StudentScheduleRequest")

export type StudentScheduleRequest = z.infer<typeof StudentScheduleRequest>

export const StudentScheduleItem = z
  .object({
    courses_code: z.string().openapi(fieldDesc("Mã học phần (Subject.code).", "TIN001")),
    courses_name: z.string().openapi(fieldDesc("Tên học phần (Subject.name).", "Tin học")),
    class_credit_hour: z.number().openapi(fieldDesc("Số tín chỉ (Subject.credit).", 3)),
    class_id: z.string().openapi(fieldDesc("Mã lớp học phần (SubjectClass.code).", "LHP001")),
    class_time: z
      .string()
      .openapi(
        fieldDesc("Lịch học: Thứ - tiết bắt đầu - tiết kết thúc (SubjectClassTime).", "T2 - 1 - 3")
      ),
    class_classroom: z.string().openapi(fieldDesc("Tên phòng học (Room.name).", "A1-201")),
  })
  .openapi("StudentScheduleItem")

export type StudentScheduleItem = z.infer<typeof StudentScheduleItem>

export const StudentScheduleResponse = SuccessResponseSchema.extend({
  class_terms: z.string().openapi(fieldDesc("Học kỳ đã tra cứu.", "2025-2026 HK1")),
  students_code: z.string().openapi(fieldDesc("Mã sinh viên.", "21000001")),
  students_schedules: z
    .array(StudentScheduleItem)
    .openapi(fieldDesc("Danh sách lớp và lịch học của sinh viên trong kỳ.")),
}).openapi("StudentScheduleResponse")

export type StudentScheduleResponse = z.infer<typeof StudentScheduleResponse>
