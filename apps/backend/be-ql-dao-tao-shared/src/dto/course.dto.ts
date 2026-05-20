import { z } from "@hono/zod-openapi"
import type { ExamType } from "@workspace/db"
import { fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const TYPE_PROGRAM = {
  NOT_IN_CURRICULUM: "0",
  IN_CURRICULUM: "1",
} as const

export const TYPE_REGISTRABLE = {
  REGISTRABLE: "0",
  UN_REGISTRABLE: "1",
} as const

export const OpenCoursesRequest = z
  .object({
    students_code: z.string().openapi(fieldDesc("Mã sinh viên (Student.code).", "21000001")),
    session_code: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Mã đợt đăng ký (ClassRegisterSession.code). Bỏ trống = lấy tất cả đợt đang mở.",
          "DK_HK1_2526"
        )
      ),
    program_code: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Mã phiên bản CTĐT (CurriculumVersion.code). Dùng thay CTĐT mặc định của sinh viên.",
          "CNTT_2021"
        )
      ),
    type_program: z
      .nativeEnum(TYPE_PROGRAM)
      .optional()
      .default(TYPE_PROGRAM.IN_CURRICULUM)
      .openapi(fieldDesc("Lọc học phần: 0 = ngoài khung CTĐT; 1 = trong khung CTĐT của sinh viên.")),
    key_word: z
      .string()
      .optional()
      .openapi(fieldDesc("Từ khóa tìm theo tên học phần (SubjectVersion.name).", "Tin học")),
    type: z
      .nativeEnum(TYPE_REGISTRABLE)
      .optional()
      .openapi(
        fieldDesc("Lọc lớp còn chỗ: 0 = còn đăng ký được; 1 = đã đủ sinh viên; bỏ trống = tất cả.")
      ),
  })
  .openapi("OpenCoursesRequest")

export type OpenCoursesRequest = z.infer<typeof OpenCoursesRequest>

export const ClassDetailsSchema = z
  .object({
    session_code: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã đợt đăng ký (ClassRegisterSession.code).", "DK_HK1_2526")),
    program_code: z
      .string()
      .nullish()
      .openapi(fieldDesc("Mã CTĐT áp dụng (CurriculumVersion.code).", "CNTT_2021")),
    type_program: z
      .nativeEnum(TYPE_PROGRAM)
      .openapi(fieldDesc("0 = ngoài khung; 1 = trong khung CTĐT.")),
    courses_code: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã học phần (SubjectVersion.code).", "TIN001")),
    courses_name: z.string().openapi(fieldDesc("Tên học phần (SubjectVersion.name).", "Tin học")),
    class_id: z.string().openapi(fieldDesc("ID lớp học phần (SubjectClass.id).", "clxxx")),
    class_students_reg: z
      .number()
      .openapi(fieldDesc("Sĩ số tối đa lớp (SubjectClass.maxStudent).", 60)),
    class_students_count: z
      .number()
      .openapi(fieldDesc("Số SV đã đăng ký (đếm ClassRegisterLogs).", 45)),
    class_teachers: z
      .string()
      .openapi(fieldDesc("Giảng viên chính + phụ (UserProfile.fullname).", "PGS.TS Nguyễn Văn A")),
    class_credit_hour: z.number().openapi(fieldDesc("Số tín chỉ (SubjectVersion.credit).", 3)),
    class_tuition: z
      .number()
      .openapi(fieldDesc("Học phí dự kiến = credit × ClassRegisterSession.tuitionPerCredit.", 900000)),
    class_time: z
      .string()
      .openapi(fieldDesc("Lịch học gộp: Thứ(tiết bắt đầu-tiết kết thúc), từ SubjectClassTime.", "T2(1-3), T4(4-6)")),
    class_exam_date: z
      .date()
      .nullable()
      .openapi(fieldDesc("Ngày thi dự kiến (SubjectClass.examDate).")),
  })
  .openapi("ClassDetails")

export type ClassDetails = z.infer<typeof ClassDetailsSchema>

export const OpenCourseResponse = SuccessResponseSchema.extend({
  data: z.array(ClassDetailsSchema),
}).openapi("OpenCourseResponse")

export type OpenCourseResponse = z.infer<typeof OpenCourseResponse>

export const CoursesDetailRequest = z
  .object({
    class_id: z.string().openapi(fieldDesc("ID lớp học phần cần xem chi tiết (SubjectClass.id).", "clxxx")),
  })
  .openapi("CoursesDetailRequest")

export const EXAM_TYPE = {
  Oral: 1,
  OfflineWritten: 2,
  Practice: 3,
  Project: 4,
  Other: 5,
  OnlineWritten: 6,
} as const satisfies Record<ExamType, number>

export const StudyScheduleItem = z
  .object({
    study_date: z
      .string()
      .openapi(fieldDesc("Thứ trong tuần (SubjectClassTime.dayOfWeek): 2–7 = T2–T7, 8 = Chủ nhật.", "2")),
    study_period_start: z
      .number()
      .openapi(fieldDesc("Tiết học bắt đầu (SubjectClassTime.startPeriod).", 1)),
    study_period_end: z
      .number()
      .openapi(fieldDesc("Tiết học kết thúc (SubjectClassTime.endPeriod).", 3)),
  })
  .openapi("StudyScheduleItem")

export const CoursesDetailResponse = SuccessResponseSchema.extend({
  class_terms: z.string().openapi(fieldDesc("Tên học kỳ (Semester.name).", "2025-2026 HK1")),
  courses_code: z.string().nullable().openapi(fieldDesc("Mã học phần (Subject.code).", "TIN001")),
  courses_name: z.string().openapi(fieldDesc("Tên học phần (Subject.name).", "Tin học")),
  class_id: z.string().openapi(fieldDesc("ID lớp học phần.", "clxxx")),
  class_classroom: z
    .string()
    .openapi(fieldDesc("Phòng học: Tòa nhà - Phòng (Building.name - Room.name).", "A1 - 201")),
  exam_type: z
    .nativeEnum(EXAM_TYPE)
    .nullable()
    .openapi(fieldDesc("Hình thức thi: 1=Vấn đáp, 2=Viết, 3=Trực tuyến/TN, 4=Trắc nghiệm, 5=Khác, 6=Thi viết online.")),
  teacher_1: z.string().nullable().openapi(fieldDesc("Giảng viên chính (học hàm + họ tên).", "PGS.TS Nguyễn Văn A")),
  teacher_2: z.string().nullable().openapi(fieldDesc("Giảng viên phụ.", "ThS. Trần Văn B")),
  study_schedules: z
    .array(StudyScheduleItem)
    .openapi(fieldDesc("Lịch học chi tiết theo thứ và tiết.")),
  students_list: z
    .array(z.string())
    .openapi(fieldDesc("Danh sách mã/ID sinh viên đã đăng ký lớp (Student.id).")),
}).openapi("CoursesDetailResponse")
