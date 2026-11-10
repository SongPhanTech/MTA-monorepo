import { z } from "@hono/zod-openapi"
import { SuccessResponseSchema } from "./base"
import { fieldDesc } from "./openapi-helpers"

export const V1SearchQuery = z
  .object({
    q: z
      .string()
      .optional()
      .openapi(fieldDesc("Từ khóa tìm kiếm (không phân biệt hoa thường).", "TOAN")),
  })
  .openapi("V1SearchQuery")

export const V1SubjectClassListQuery = z
  .object({
    q: z
      .string()
      .optional()
      .openapi(fieldDesc("Tìm theo mã/tên lớp hoặc học phần.", "LHP001")),
    semester_code: z
      .string()
      .optional()
      .openapi(fieldDesc("Lọc theo mã học kỳ (Semester.code).", "HK1-2025")),
  })
  .openapi("V1SubjectClassListQuery")

export const V1ClassCodeParam = z
  .object({
    class_code: z.string().openapi(fieldDesc("Mã lớp học phần (SubjectClass.code).", "LHP001")),
  })
  .openapi("V1ClassCodeParam")

export const V1SubjectItem = z
  .object({
    subject_code: z.string().nullish().openapi(fieldDesc("Mã học phần.", "TIN001")),
    subject_name: z.string().openapi(fieldDesc("Tên học phần.", "Tin học đại cương")),
    courser: z.number().nullish().openapi(fieldDesc("Số tiết.", 45)),
    class_credit_hour: z.number().openapi(fieldDesc("Số tín chỉ.", 3)),
    dvht: z.number().openapi(fieldDesc("Đơn vị học trình ≈ period/15.", 3)),
    description: z.string().openapi(fieldDesc("Hình thức thi.", "Thi viết")),
  })
  .openapi("V1SubjectItem")

export const V1SubjectsResponse = SuccessResponseSchema.extend({
  data: z.array(V1SubjectItem),
}).openapi("V1SubjectsResponse")

export const V1TeacherRef = z
  .object({
    teacher_code: z.string().nullish().openapi(fieldDesc("Mã GV.", "GV001")),
    teacher: z.string().openapi(fieldDesc("Họ tên GV.", "Nguyễn Văn A")),
  })
  .openapi("V1TeacherRef")

export const V1SubjectClassListItem = z
  .object({
    class_code: z.string().openapi(fieldDesc("Mã lớp học phần.", "LHP001")),
    class_name: z.string().openapi(fieldDesc("Tên lớp học phần.", "Tin học đại cương - N01")),
    subject_code: z.string().nullish().openapi(fieldDesc("Mã học phần.", "TIN001")),
    subject_name: z.string().openapi(fieldDesc("Tên học phần.", "Tin học đại cương")),
    semester_name: z.string().openapi(fieldDesc("Tên học kỳ.", "Học kỳ 1 2025-2026")),
    main_teacher: z.string().nullish().openapi(fieldDesc("Giảng viên chính.", "Nguyễn Văn A")),
    extra_teacher: z.string().nullish().openapi(fieldDesc("Giảng viên phụ.", "Trần Thị B")),
    enrolled_count: z.number().openapi(fieldDesc("Sĩ số đã ghi danh.", 40)),
  })
  .openapi("V1SubjectClassListItem")

export const V1SubjectClassesResponse = SuccessResponseSchema.extend({
  data: z.array(V1SubjectClassListItem),
}).openapi("V1SubjectClassesResponse")

export const V1StudentItem = z
  .object({
    student_code: z.string().nullish().openapi(fieldDesc("Mã học viên.", "25150001")),
    student_name: z.string().openapi(fieldDesc("Họ tên học viên.", "Lê Văn C")),
  })
  .openapi("V1StudentItem")

export const V1SubjectClassDetail = z
  .object({
    class_code: z.string(),
    class_name: z.string(),
    main_teacher: V1TeacherRef.nullable(),
    extra_teacher: V1TeacherRef.nullable(),
    students: z.array(V1StudentItem),
    enrolled_count: z.number(),
  })
  .openapi("V1SubjectClassDetail")

export const V1SubjectClassDetailResponse = SuccessResponseSchema.extend({
  data: V1SubjectClassDetail,
}).openapi("V1SubjectClassDetailResponse")

export const V1LecturerItem = z
  .object({
    teacher_code: z.string().nullish().openapi(fieldDesc("Mã định danh.", "GV001")),
    teacher: z.string().openapi(fieldDesc("Họ tên.", "Nguyễn Văn A")),
    bo_mon_code: z.string().nullish().openapi(fieldDesc("Mã bộ môn.", "BM_MMT")),
    bo_mon_name: z.string().openapi(fieldDesc("Tên bộ môn.", "Bộ môn Mạng máy tính")),
    department_code: z.string().nullish().openapi(fieldDesc("Mã đơn vị (khoa/viện).", "K_CNTT")),
    department_name: z.string().openapi(fieldDesc("Tên đơn vị.", "Khoa CNTT")),
    rank_name: z.string().openapi(fieldDesc("Quân hàm / cấp bậc.", "Thượng tá")),
    position_name: z.string().openapi(fieldDesc("Chức vụ.", "Giảng viên")),
    phone_number: z.string().openapi(fieldDesc("Số điện thoại.", "0901234567")),
    working_mail: z.string().openapi(fieldDesc("Email.", "gv@mta.edu.vn")),
  })
  .openapi("V1LecturerItem")

export const V1LecturersResponse = SuccessResponseSchema.extend({
  data: z.array(V1LecturerItem),
}).openapi("V1LecturersResponse")

export const V1ErrorResponse = z
  .object({
    message: z.string(),
  })
  .openapi("V1ErrorResponse")

export const V1StudentCodeParam = z
  .object({
    student_code: z
      .string()
      .openapi(fieldDesc("Mã sinh viên / học viên (UserProfile.code).", "25150001")),
  })
  .openapi("V1StudentCodeParam")

export const V1StudentScoreItem = z
  .object({
    subject_code: z.string().nullish().openapi(fieldDesc("Mã học phần.", "TIN001")),
    subject_name: z.string().openapi(fieldDesc("Tên học phần.", "Tin học đại cương")),
    class_code: z.string().nullish().openapi(fieldDesc("Mã lớp học phần.", "TIN001 01")),
    class_name: z.string().nullish().openapi(fieldDesc("Tên lớp học phần.", "Tin học đại cương - N01")),
    class_type: z
      .string()
      .openapi(
        fieldDesc(
          "Loại lớp: NORMAL | RETAKE (học lại) | REEXAM (thi lại) | LINKED | STAYBACK | TRANSFER.",
          "RETAKE"
        )
      ),
    is_retake: z.boolean().openapi(fieldDesc("true nếu lớp học lại (SubjectClass.type = RETAKE).", true)),
    is_reexam: z.boolean().openapi(fieldDesc("true nếu lớp thi lại (SubjectClass.type = REEXAM).", false)),
    is_improving: z
      .boolean()
      .openapi(fieldDesc("true nếu đăng ký học cải thiện (StudentSubjectScore.isImproving).", false)),
    credit: z.number().openapi(fieldDesc("Số tín chỉ.", 3)),
    attendance_score: z.number().nullish().openapi(fieldDesc("Điểm chuyên cần / thường xuyên.", 8)),
    midterm_score: z.number().nullish().openapi(fieldDesc("Điểm định kỳ / giữa kỳ.", 7)),
    exam_score: z.number().nullish().openapi(fieldDesc("Điểm thi.", 8)),
    final_score10: z.number().nullish().openapi(fieldDesc("Điểm tổng kết thang 10.", 8.5)),
    final_score4: z.number().nullish().openapi(fieldDesc("Điểm quy đổi thang 4.", 3.5)),
    grade_letter: z.string().nullish().openapi(fieldDesc("Điểm chữ.", "B+")),
    pass: z.boolean().openapi(fieldDesc("Đạt / không đạt.", true)),
    bonus_score: z.number().openapi(fieldDesc("Điểm cộng từ thành tích.", 0)),
    description: z.string().nullish().openapi(fieldDesc("Ghi chú điểm.", "")),
  })
  .openapi("V1StudentScoreItem")

export const V1StudentScoreSemester = z
  .object({
    semester_code: z.string().nullish().openapi(fieldDesc("Mã học kỳ.", "080")),
    semester_name: z.string().openapi(fieldDesc("Tên học kỳ.", "Học kỳ 1 2025-2026")),
    scores: z.array(V1StudentScoreItem).openapi(fieldDesc("Danh sách điểm trong học kỳ.")),
  })
  .openapi("V1StudentScoreSemester")

export const V1StudentScoresData = z
  .object({
    student_code: z.string().nullish().openapi(fieldDesc("Mã sinh viên.", "25150001")),
    student_name: z.string().openapi(fieldDesc("Họ tên sinh viên.", "Nguyễn Văn A")),
    semesters: z
      .array(V1StudentScoreSemester)
      .openapi(fieldDesc("Full điểm, gom nhóm theo học kỳ (mới → cũ).")),
  })
  .openapi("V1StudentScoresData")

export const V1StudentScoresResponse = SuccessResponseSchema.extend({
  data: V1StudentScoresData,
}).openapi("V1StudentScoresResponse")
