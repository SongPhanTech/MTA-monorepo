import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const StudentScoreRequest = z
  .object({
    student_code: z.string().openapi(fieldDesc("Mã sinh viên (Student.code).", "21000001")),
  })
  .openapi("StudentScoreRequest")

export type StudentScoreRequest = z.infer<typeof StudentScoreRequest>

export const StudentScoreNotFoundResponse = z
  .object({
    result_code: z.literal("404").openapi({ description: "Mã lỗi khi không tìm thấy sinh viên." }),
    result_desc: z.string().openapi(fieldDesc("Mô tả lỗi.", "Không tìm thấy thông tin sinh viên!")),
  })
  .openapi("StudentScoreNotFoundResponse")

export const StudentScoreItem = z
  .object({
    subject_code: z.string().nullish().openapi(fieldDesc("Mã học phần (SubjectVersion.code).", "TIN001")),
    subject_name: z.string().openapi(fieldDesc("Tên học phần.", "Tin học")),
    class_id: z.string().openapi(fieldDesc("ID lớp học phần (SubjectClass.id).", "clxxx")),
    attendanceScore: z
      .number()
      .nullish()
      .openapi(fieldDesc("Điểm chuyên cần (SubjectClassStudent.attendanceScore).", 8)),
    midtermScore: z
      .number()
      .nullish()
      .openapi(fieldDesc("Điểm giữa kỳ (SubjectClassStudent.midtermScore).", 7)),
    examScore: z
      .number()
      .nullish()
      .openapi(fieldDesc("Điểm thi (SubjectClassStudent.examScore).", 8)),
    credit: z.number().openapi(fieldDesc("Số tín chỉ (SubjectVersion.credit).", 3)),
    final_score10: z
      .number()
      .nullish()
      .openapi(fieldDesc("Điểm tổng kết thang 10 (manualFinalScore hoặc finalScore).", 8.5)),
    final_score4: z
      .number()
      .nullish()
      .openapi(fieldDesc("Điểm quy đổi thang 4 (ScoreConvert).", 3.5)),
    grade_letter: z
      .string()
      .nullish()
      .openapi(fieldDesc("Điểm chữ (ScoreConvert.letter).", "B+")),
    pass: z.boolean().openapi(fieldDesc("Đạt / không đạt môn (ScoreConvert.pass).", true)),
    bonusScore: z
      .number()
      .default(0)
      .openapi(fieldDesc("Điểm cộng từ thành tích (ArchivedAward.bonusScore).", 0)),
    archivedCertificate: z
      .string()
      .openapi(fieldDesc("Mã chứng chỉ/minh chứng đạt được, nối bằng dấu phẩy.", "")),
    description: z
      .string()
      .nullish()
      .openapi(fieldDesc("Ghi chú điểm (SubjectClassStudent.description).", "")),
  })
  .openapi("StudentScoreItem")

export type StudentScoreItem = z.infer<typeof StudentScoreItem>

export const StudentScoreSemester = z
  .object({
    semester_name: z.string().openapi(fieldDesc("Tên học kỳ (Semester.name).", "2025-2026 HK1")),
    semester_code: z.string().nullish().openapi(fieldDesc("Mã học kỳ (Semester.code).", "080")),
    subject_classes: z
      .array(StudentScoreItem)
      .openapi(fieldDesc("Danh sách điểm từng học phần trong kỳ.")),
  })
  .openapi("StudentScoreSemester")

export const StudentScoreResponse = SuccessResponseSchema.extend({
  semesters: z
    .array(StudentScoreSemester)
    .openapi(fieldDesc("Bảng điểm theo từng học kỳ (Semester).")),
}).openapi("StudentScoreResponse")

export type StudentScoreResponse = z.infer<typeof StudentScoreResponse>
