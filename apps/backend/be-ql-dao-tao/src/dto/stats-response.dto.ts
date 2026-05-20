import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const TrainingObjectTypeCountSchema = z
  .object({
    trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo (TrainingObjectType).")),
    name: z.string().openapi(fieldDesc("Tên hệ đào tạo.")),
    count: z.number().openapi(fieldDesc("Số học viên.")),
  })
  .openapi("TrainingObjectTypeCount")

export const TrainingLevelCountSchema = z
  .object({
    trainingLevelId: z.string().openapi(fieldDesc("ID bậc đào tạo (TrainingLevel).")),
    name: z.string().openapi(fieldDesc("Tên bậc đào tạo.")),
    count: z.number().openapi(fieldDesc("Số học viên.")),
  })
  .openapi("TrainingLevelCount")

export const TrainingCourseCountSchema = z
  .object({
    trainingCourseId: z.string().openapi(fieldDesc("ID khóa học (TrainingCourse).")),
    name: z.string().openapi(fieldDesc("Tên khóa học.")),
    count: z.number().openapi(fieldDesc("Số học viên.")),
  })
  .openapi("TrainingCourseCount")

export const TrainingCourseAvgEntryScoreSchema = z
  .object({
    trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    name: z.string().openapi(fieldDesc("Tên khóa học.")),
    avgEntryScore: z.number().openapi(fieldDesc("Điểm đầu vào trung bình.")),
  })
  .openapi("TrainingCourseAvgEntryScore")

export const TrainingCourseAvgGpaSchema = z
  .object({
    trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    name: z.string().openapi(fieldDesc("Tên khóa học.")),
    avgGpa: z.number().openapi(fieldDesc("GPA trung bình khóa.")),
  })
  .openapi("TrainingCourseAvgGpa")

export const TrainingCourseGraduationRateSchema = z
  .object({
    trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    name: z.string().openapi(fieldDesc("Tên khóa học.")),
    graduationRate: z.number().openapi(fieldDesc("Tỷ lệ tốt nghiệp (0–1 hoặc % tùy API).")),
  })
  .openapi("TrainingCourseGraduationRate")

export const SchoolYearGpaDistributionSchema = z
  .object({
    schoolYearId: z.string().openapi(fieldDesc("ID năm học (SchoolYear).")),
    name: z.string().openapi(fieldDesc("Tên / mã năm học.")),
    excellent: z.number().openapi(fieldDesc("Số HV xếp loại Xuất sắc.")),
    good: z.number().openapi(fieldDesc("Số HV xếp loại Giỏi.")),
    fair: z.number().openapi(fieldDesc("Số HV xếp loại Khá.")),
    average: z.number().openapi(fieldDesc("Số HV xếp loại Trung bình.")),
    weak: z.number().openapi(fieldDesc("Số HV xếp loại Yếu / Kém.")),
  })
  .openapi("SchoolYearGpaDistribution")

export const OverviewDashboardStatsSchema = z
  .object({
    totalStudents: z.number().openapi(fieldDesc("Tổng số học viên.")),
    totalLecturers: z.number().openapi(fieldDesc("Tổng số giảng viên.")),
    studentLecturerRatio: z.number().openapi(fieldDesc("Tỷ lệ HV / GV.")),
    activeCurricula: z.number().openapi(fieldDesc("Số CTĐT đang hoạt động.")),
    academicWarningRate: z.number().openapi(fieldDesc("Tỷ lệ cảnh báo học tập.")),
  })
  .openapi("OverviewDashboardStats")

export const ProvinceCountSchema = z
  .object({
    provinceId: z.string().openapi(fieldDesc("ID tỉnh / thành (Province).")),
    name: z.string().openapi(fieldDesc("Tên tỉnh / thành.")),
    count: z.number().openapi(fieldDesc("Số học viên.")),
  })
  .openapi("ProvinceCount")

export const StudentOfInterestSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID học viên (Student).")),
    name: z.string().openapi(fieldDesc("Họ tên học viên.")),
    academicWarningLevel: z.number().openapi(fieldDesc("Mức cảnh báo học tập.")),
    cumulativeDebtCredits: z.number().openapi(fieldDesc("Tín chỉ nợ tích lũy.")),
    gpa: z.number().openapi(fieldDesc("GPA hiện tại.")),
  })
  .openapi("StudentOfInterest")

export const FixedClassAvgGpaSchema = z
  .object({
    fixedClassId: z.string().openapi(fieldDesc("ID lớp cố định (FixedClass).")),
    name: z.string().openapi(fieldDesc("Tên lớp.")),
    avgGpa: z.number().openapi(fieldDesc("GPA trung bình lớp.")),
  })
  .openapi("FixedClassAvgGpa")

export const TrainingMajorAvgGpaSchema = z
  .object({
    trainingMajorId: z.string().openapi(fieldDesc("ID ngành (TrainingMajor).")),
    name: z.string().openapi(fieldDesc("Tên ngành.")),
    avgGpa: z.number().openapi(fieldDesc("GPA trung bình ngành.")),
  })
  .openapi("TrainingMajorAvgGpa")

export const SubjectPassFailSchema = z
  .object({
    subjectVersionId: z.string().openapi(fieldDesc("ID phiên bản môn (SubjectVersion).")),
    name: z.string().openapi(fieldDesc("Tên môn học.")),
    passed: z.number().openapi(fieldDesc("Số HV đạt.")),
    failed: z.number().openapi(fieldDesc("Số HV trượt.")),
  })
  .openapi("SubjectPassFail")

export const ActiveCurriculaStatsSchema = z
  .object({
    activeCurricula: z.number().openapi(fieldDesc("Số CTĐT đang hoạt động.")),
    activeCurriculumVersions: z
      .number()
      .openapi(fieldDesc("Số phiên bản CTĐT đang hoạt động.")),
  })
  .openapi("ActiveCurriculaStats")

export const SubjectClassFillItemSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID lớp học phần (SubjectClass).")),
    name: z.string().openapi(fieldDesc("Tên lớp học phần.")),
    fillRate: z.number().openapi(fieldDesc("Tỷ lệ lấp đầy chỗ (0–1).")),
    failureRate: z.number().openapi(fieldDesc("Tỷ lệ trượt / không đạt.")),
  })
  .openapi("SubjectClassFillItem")

export const SubjectClassStatsSchema = z
  .object({
    totalClasses: z.number().openapi(fieldDesc("Tổng số lớp học phần.")),
    classes: z
      .array(SubjectClassFillItemSchema)
      .openapi(fieldDesc("Chi tiết từng lớp học phần.")),
    labels: z.array(z.string()).openapi(fieldDesc("Nhãn cột biểu đồ.")),
  })
  .openapi("SubjectClassStats")

export const LecturerWorkloadSchema = z
  .object({
    lecturerId: z.string().openapi(fieldDesc("ID giảng viên (Lecturer).")),
    name: z.string().openapi(fieldDesc("Họ tên giảng viên.")),
    classCount: z.number().openapi(fieldDesc("Số lớp được phân công.")),
    totalPeriods: z.number().openapi(fieldDesc("Tổng số tiết giảng dạy.")),
  })
  .openapi("LecturerWorkload")

export const RankingCountSchema = z
  .object({
    ranking: z.string().openapi(fieldDesc("Xếp loại học lực / hạng.")),
    count: z.number().openapi(fieldDesc("Số học viên.")),
  })
  .openapi("RankingCount")

export const IdNameCountSchema = z
  .object({
    id: z.string().openapi(fieldDesc("ID đối tượng thống kê.")),
    name: z.string().openapi(fieldDesc("Tên hiển thị.")),
    count: z.number().openapi(fieldDesc("Số lượng / giá trị đếm.")),
  })
  .openapi("IdNameCount")

export const NameCountSchema = z
  .object({
    name: z.string().openapi(fieldDesc("Tên nhóm / nhãn.")),
    count: z.number().openapi(fieldDesc("Số lượng.")),
  })
  .openapi("NameCount")
