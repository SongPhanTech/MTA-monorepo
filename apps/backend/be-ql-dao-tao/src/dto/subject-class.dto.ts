import { z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { fieldDesc } from "./openapi-helpers"

export const OpenSubjectClass = z
  .object({
    trainingMajorId: z.string().openapi(fieldDesc("ID ngành đào tạo (TrainingMajor).")),
    managementOrganizationId: z
      .string()
      .openapi(fieldDesc("ID đơn vị quản lý môn (ManagementOrganization).")),
    managementOrganizationName: z.string().openapi(fieldDesc("Tên đơn vị quản lý môn.")),
    subjectVersionId: z.string().openapi(fieldDesc("ID phiên bản môn học (SubjectVersion).")),
    subjectVersionName: z.string().openapi(fieldDesc("Tên học phần.")),
    subjectVersionCode: z.string().openapi(fieldDesc("Mã học phần.")),
    managementOrganizationCode: z.string().openapi(fieldDesc("Mã đơn vị quản lý.")),
    subjectVersionCredit: z.number().openapi(fieldDesc("Số tín chỉ học phần.")),
    fixedClass: z
      .array(
        z.object({
          trainingBlockSubjectId: z
            .string()
            .openapi(fieldDesc("ID môn trong khối CTĐT (TrainingBlockSubject).")),
          fixedClassId: z.string().openapi(fieldDesc("ID lớp niên chế (FixedClass).")),
          fixedClassName: z.string().openapi(fieldDesc("Tên lớp niên chế.")),
          fixedClassCount: z.number().openapi(fieldDesc("Số học viên lớp niên chế.")),
          fixedClassSemester: z.number().openapi(fieldDesc("Học kỳ của lớp niên chế.")),
          fixedClassCode: z.string().openapi(fieldDesc("Mã lớp niên chế.")),
          trainingCourseId: z.string().openapi(fieldDesc("ID khóa học (TrainingCourse).")),
          curriculumVersionId: z
            .string()
            .openapi(fieldDesc("ID phiên bản CTĐT (CurriculumVersion).")),
          curriculumVersionName: z.string().openapi(fieldDesc("Tên phiên bản CTĐT.")),
          curriculumVersionCode: z.string().openapi(fieldDesc("Mã phiên bản CTĐT.")),
        })
      )
      .openapi(fieldDesc("Danh sách lớp niên chế có thể mở lớp học phần.")),
    countStudent: z.number().openapi(fieldDesc("Tổng số học viên liên quan.")),
  })
  .openapi("OpenSubjectClass")

export type OpenSubjectClass = z.infer<typeof OpenSubjectClass>

export const EnrollFixedClassOnSubjectClass = z
  .object({
    id: z.string().openapi(fieldDesc("ID bản ghi Student.")),
    code: z.string().openapi(fieldDesc("Mã học viên.")),
    active: z.boolean().openapi(fieldDesc("Trạng thái hoạt động.")),
    description: z.string().nullable().openapi(fieldDesc("Ghi chú.")),
    deletedAt: z.coerce.date().nullable().openapi(fieldDesc("Thời điểm xóa mềm.")),
    createdAt: z.coerce.date().openapi(fieldDesc("Ngày tạo.")),
    updatedAt: z.coerce.date().openapi(fieldDesc("Ngày cập nhật.")),
    from: z.coerce.date().nullable().openapi(fieldDesc("Ngày bắt đầu học.")),
    to: z.coerce.date().nullable().openapi(fieldDesc("Ngày kết thúc học.")),
    trainingLocationId: z.string().nullable().openapi(fieldDesc("ID khu vực đào tạo.")),
    status: z.nativeEnum($Enums.StudentStatus).openapi(fieldDesc("Trạng thái học viên.")),
    fixedClassId: z.string().openapi(fieldDesc("ID lớp niên chế.")),
    userProfileId: z.string().openapi(fieldDesc("ID hồ sơ người dùng (UserProfile).")),
    trainingLevelId: z.string().nullable().openapi(fieldDesc("ID bậc đào tạo.")),
    trainingObjectTypeId: z.string().nullable().openapi(fieldDesc("ID hệ đào tạo.")),
    trainingTypeId: z.string().nullable().openapi(fieldDesc("ID loại hình đào tạo.")),
    trainingFormId: z.string().nullable().openapi(fieldDesc("ID hình thức đào tạo.")),
    registrationAreaId: z.string().nullable().openapi(fieldDesc("ID khu vực đăng ký.")),
    curriculumVersionId: z.string().openapi(fieldDesc("ID phiên bản CTĐT.")),
    userProfile: z.object({
      id: z.string().openapi(fieldDesc("ID UserProfile.")),
      code: z.string().nullable().openapi(fieldDesc("Mã cán bộ / học viên.")),
      lastName: z.string().openapi(fieldDesc("Họ.")),
      firstName: z.string().openapi(fieldDesc("Tên.")),
      familyName: z.string().nullable().openapi(fieldDesc("Tên đệm.")),
      gender: z.string().openapi(fieldDesc("Giới tính.")),
      dateOfBirth: z.coerce.date().openapi(fieldDesc("Ngày sinh.")),
    }),
    fixedClass: z.object({
      id: z.string().openapi(fieldDesc("ID FixedClass.")),
      name: z.string().openapi(fieldDesc("Tên lớp niên chế.")),
      code: z.string().openapi(fieldDesc("Mã lớp niên chế.")),
      trainingCourse: z.object({
        id: z.string().openapi(fieldDesc("ID TrainingCourse.")),
        name: z.string().openapi(fieldDesc("Tên khóa.")),
        code: z.string().openapi(fieldDesc("Mã khóa.")),
      }),
      curriculumVersion: z.object({
        id: z.string().openapi(fieldDesc("ID CurriculumVersion.")),
        name: z.string().openapi(fieldDesc("Tên CTĐT.")),
        code: z.string().openapi(fieldDesc("Mã CTĐT.")),
        curriculum: z.object({
          id: z.string().openapi(fieldDesc("ID Curriculum.")),
          name: z.string().openapi(fieldDesc("Tên chương trình.")),
          code: z.string().openapi(fieldDesc("Mã chương trình.")),
          trainingMajor: z.object({
            id: z.string().openapi(fieldDesc("ID TrainingMajor.")),
            name: z.string().openapi(fieldDesc("Tên ngành.")),
            code: z.string().openapi(fieldDesc("Mã ngành.")),
          }),
        }),
      }),
    }),
  })
  .openapi("EnrollFixedClassOnSubjectClass")

export type EnrollFixedClassOnSubjectClass = z.infer<typeof EnrollFixedClassOnSubjectClass>
