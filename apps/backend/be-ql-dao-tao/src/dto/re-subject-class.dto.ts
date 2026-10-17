import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const OpenSubjectClassRetakeItemSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID phiên bản môn (SubjectVersion).")),
    code: z.string().openapi(fieldDesc("Mã học phần.")),
    name: z.string().openapi(fieldDesc("Tên học phần.")),
    trainingObjectTypeId: z.string().nullable().openapi(fieldDesc("ID hệ đào tạo.")),
    trainingMajorId: z.string().nullable().openapi(fieldDesc("ID ngành.")),
    trainingCourseId: z.string().nullable().openapi(fieldDesc("ID khóa học.")),
    trainingBlockSubjectId: z
      .string()
      .openapi(fieldDesc("ID môn trong khối CTĐT (TrainingBlockSubject).")),
    count: z.number().openapi(fieldDesc("Số học viên nợ môn.")),
  })
  .openapi("OpenSubjectClassRetakeItem")

export const RetakeStudentItemSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID bản ghi điểm (StudentSubjectScore).")),
    code: z.string().openapi(fieldDesc("Mã học viên.")),
    userProfile: z
      .object({
        fullname: z.string().openapi(fieldDesc("Họ tên.")),
      })
      .openapi(fieldDesc("Thông tin hồ sơ.")),
    fixedClass: z
      .object({
        code: z.string().openapi(fieldDesc("Mã lớp niên chế.")),
        trainingCourse: z
          .object({
            name: z.string().openapi(fieldDesc("Tên khóa học.")),
          })
          .openapi(fieldDesc("Khóa học.")),
      })
      .openapi(fieldDesc("Lớp niên chế.")),
    studentId: z.string().openapi(fieldDesc("ID học viên (Student).")),
    thuong_xuyen: z.number().nullable().openapi(fieldDesc("Điểm thường xuyên.")),
    dinh_ky: z.number().nullable().openapi(fieldDesc("Điểm định kỳ / giữa kỳ.")),
    diem_thi: z.number().nullable().optional().openapi(fieldDesc("Điểm thi kết thúc HP.")),
    diem_cuoi: z.number().nullable().openapi(fieldDesc("Điểm cuối kỳ (nếu có).")),
    withdrew: z.boolean().openapi(fieldDesc("true = rút học phần.")),
    mien_thi: z.boolean().openapi(fieldDesc("true = miễn thi.")),
    reason: z.string().nullable().openapi(fieldDesc("Lý do miễn / rút.")),
    hoan_thi: z.boolean().openapi(fieldDesc("true = hoãn thi.")),
    ly_do_hoan_thi: z.string().nullable().openapi(fieldDesc("Lý do hoãn thi.")),
    cam_thi: z.boolean().openapi(fieldDesc("true = cấm thi.")),
    ly_do_cam_thi: z.string().nullable().openapi(fieldDesc("Lý do cấm thi.")),
    dinh_chi: z.boolean().openapi(fieldDesc("true = đình chỉ thi.")),
    ly_do_dinh_chi: z.string().nullable().openapi(fieldDesc("Lý do đình chỉ.")),
    truot_mon: z.boolean().openapi(fieldDesc("true = trượt môn / không đạt.")),
  })
  .openapi("RetakeStudentItem")

export const ReExamStudentItemSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID bản ghi điểm.")),
    code: z.string().openapi(fieldDesc("Mã học viên.")),
    userProfile: z
      .object({
        fullname: z.string().openapi(fieldDesc("Họ tên.")),
      })
      .openapi(fieldDesc("Hồ sơ.")),
    fixedClass: z
      .object({
        code: z.string().openapi(fieldDesc("Mã lớp NC.")),
        trainingCourse: z
          .object({
            name: z.string().openapi(fieldDesc("Tên khóa.")),
          })
          .openapi(fieldDesc("Khóa học.")),
      })
      .openapi(fieldDesc("Lớp niên chế.")),
    studentId: z.string().openapi(fieldDesc("ID học viên.")),
    thuong_xuyen: z.number().nullable().optional().openapi(fieldDesc("Điểm thường xuyên.")),
    dinh_ky: z.number().nullable().optional().openapi(fieldDesc("Điểm định kỳ.")),
    diem_thi: z.number().nullable().optional().openapi(fieldDesc("Điểm thi kết thúc HP.")),
    diem_cuoi: z.number().nullable().openapi(fieldDesc("Điểm cuối kỳ.")),
    withdrew: z.boolean().openapi(fieldDesc("Rút học phần.")),
    mien_thi: z.boolean().openapi(fieldDesc("Miễn thi.")),
    hoan_thi: z.boolean().openapi(fieldDesc("Hoãn thi.")),
    ly_do_hoan_thi: z.string().nullable().openapi(fieldDesc("Lý do hoãn thi.")),
    cam_thi: z.boolean().optional().openapi(fieldDesc("Cấm thi.")),
    ly_do_cam_thi: z.string().nullable().optional().openapi(fieldDesc("Lý do cấm thi.")),
    dinh_chi: z.boolean().optional().openapi(fieldDesc("Đình chỉ thi.")),
    ly_do_dinh_chi: z.string().nullable().optional().openapi(fieldDesc("Lý do đình chỉ.")),
    reason: z.string().nullable().optional().openapi(fieldDesc("Lý do thi lại.")),
    truot_mon: z.boolean().openapi(fieldDesc("Trượt môn.")),
  })
  .openapi("ReExamStudentItem")
