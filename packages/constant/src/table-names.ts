/**
 * Bảng ánh xạ mã thực thể CSDL (PascalCase) sang tên tiếng Việt chuẩn
 */
export const TABLE_NAME_MAP: Record<string, string> = {
  // Đăng ký học & Lớp học
  ClassRegisterLogs: "Nhật ký đăng ký học",
  StudentSubjectScore: "Điểm môn học",
  SubjectClass: "Lớp học phần",
  SubjectClassTime: "Lịch học lớp học phần",
  ClassSchedule: "Thời khóa biểu",
  ClassRegisterSession: "Đợt đăng ký",
  ClassRegisterSessionCredit: "Giới hạn tín chỉ",
  FixedClass: "Lớp niên chế",

  // Sinh viên & Giảng viên & Cán bộ
  Student: "Sinh viên",
  UserProfile: "Hồ sơ người dùng",
  Lecturer: "Giảng viên",
  LecturerType: "Loại giảng viên",
  Staff: "Cán bộ / Nhân viên",
  StaffType: "Loại nhân viên",
  StaffPosition: "Vị trí công tác",

  // Môn học & Đào tạo
  Subject: "Môn học",
  SubjectVersion: "Phiên bản môn học",
  SubjectVersionCategory: "Loại phiên bản môn học",
  Curriculum: "Chương trình đào tạo",
  CurriculumVersion: "Phiên bản CTĐT",
  TrainingBlock: "Khối kiến thức",
  TrainingBlockSubject: "Môn trong khối kiến thức",
  TrainingBlockOnCurriculumVersion: "Khối theo CTĐT",
  TrainingField: "Lĩnh vực đào tạo",
  TrainingMajor: "Ngành đào tạo",
  TrainingCourse: "Khóa học",
  TrainingCourseRegulation: "Quy chế khóa học",
  TrainingObjectType: "Đối tượng đào tạo",
  TrainingType: "Loại hình đào tạo",
  TrainingLevel: "Trình độ đào tạo",
  TrainingForm: "Hình thức đào tạo",
  TrainingTime: "Thời gian đào tạo",
  TrainingLanguage: "Ngôn ngữ đào tạo",
  TrainingLocation: "Địa điểm đào tạo",

  // Cơ sở & Phòng ốc
  DM_DonVi: "Đơn vị / Khoa / Viện",
  Building: "Tòa nhà",
  Room: "Phòng học",
  SchoolYear: "Năm học",
  Semester: "Học kỳ",

  // Văn bằng & Đánh giá
  DiplomaType: "Loại văn bằng",
  AcademicRankingConvert: "Quy đổi xếp loại",
  AcademicWarningRule: "Quy tắc cảnh báo học tập",
  DisciplinaryWarningReason: "Lý do kỷ luật",
  Scholarship: "Học bổng",
  ScholarshipCriteria: "Tiêu chuẩn học bổng",
  PriorityObject: "Đối tượng ưu tiên",
  LoadCategory: "Định mức giảng dạy",
  Exam: "Lịch thi",
  TemplateFile: "File mẫu",

  // Các bảng nghiệp vụ khác
  PlanTraining: "Kế hoạch đào tạo",
  PlanTrainingPractice: "Kế hoạch thực hành đào tạo",
  GraduationSession: "Đợt xét tốt nghiệp",
  ThesisSession: "Đợt bảo vệ đồ án / khóa luận",
  TrainingScoreSession: "Đợt đánh giá rèn luyện",
  Survey: "Phiếu khảo sát",
  SurveyObjectType: "Đối tượng khảo sát",
  ScoreCorrectionTicket: "Phiếu sửa điểm",
  ScoreLinkSheet: "Bảng liên kết điểm",
  AvailableTrainingTime: "Thời gian đào tạo khả dụng",
  User: "Người dùng",
  Role: "Vai trò",
  Permission: "Quyền hạn",
  Group: "Nhóm người dùng",
  Document: "Tài liệu",
  Notification: "Thông báo",
  ChangeLog: "Nhật ký thay đổi",
  Config: "Cấu hình hệ thống",
  TuitionPaymentConfig: "Cấu hình thanh toán học phí",
}

// Bảng tra cứu phụ cho chữ thường để tự động nhận diện không phân biệt hoa thường
const LOWER_CASE_MAP: Record<string, string> = {}
for (const [key, value] of Object.entries(TABLE_NAME_MAP)) {
  LOWER_CASE_MAP[key.toLowerCase()] = value
}

// Tập hợp nhãn tiếng Việt hợp lệ
const VIETNAMESE_TABLE_NAMES = new Set(
  Object.values(TABLE_NAME_MAP).map((v) => v.toLowerCase())
)

/**
 * Chuẩn hóa tên khóa: loại bỏ phần mở ngoặc stub hoặc ký tự thừa
 */
export function cleanModelKey(rawKey: string): string {
  if (!rawKey) return ""
  return rawKey
    .replace(/\s*\(.*/g, "")
    .replace(/[\(\)]+/g, "")
    .trim()
}

/**
 * Kiểm tra xem một key có phải là bảng CSDL / danh mục hợp lệ hay không.
 * Tự động loại bỏ các biến đếm nghiệp vụ / đếm dòng (createdLogs, updatedScores, total, failed,...)
 */
export function isDatabaseTable(rawKey: string): boolean {
  if (!rawKey) return false
  const trimmed = rawKey.trim()
  if (!trimmed || trimmed.startsWith("_")) return false

  const baseKey = cleanModelKey(trimmed)
  if (!baseKey) return false

  if (TABLE_NAME_MAP[trimmed] || TABLE_NAME_MAP[baseKey]) return true
  if (LOWER_CASE_MAP[trimmed.toLowerCase()] || LOWER_CASE_MAP[baseKey.toLowerCase()]) return true

  if (
    VIETNAMESE_TABLE_NAMES.has(trimmed.toLowerCase()) ||
    VIETNAMESE_TABLE_NAMES.has(baseKey.toLowerCase())
  ) {
    return true
  }

  return false
}

/**
 * Lấy tên hiển thị tiếng Việt của bảng CSDL.
 * Trả về chuỗi rỗng nếu không phải bảng CSDL hợp lệ.
 */
export function getTableDisplayName(rawKey: string): string {
  if (!rawKey) return ""
  const trimmed = rawKey.trim()
  const baseKey = cleanModelKey(trimmed)

  const mapped =
    TABLE_NAME_MAP[trimmed] ||
    TABLE_NAME_MAP[baseKey] ||
    LOWER_CASE_MAP[trimmed.toLowerCase()] ||
    LOWER_CASE_MAP[baseKey.toLowerCase()]

  if (mapped) return mapped

  for (const name of Object.values(TABLE_NAME_MAP)) {
    if (
      name.toLowerCase() === trimmed.toLowerCase() ||
      name.toLowerCase() === baseKey.toLowerCase()
    ) {
      return name
    }
  }

  return ""
}

export type SyncCategoryMeta = {
  key: string
  label: string
}

/**
 * Sinh danh sách metadata bảng đồng bộ (key + label tiếng Việt) để backend đính kèm vào DataSyncHistory
 */
export function buildSyncCategories(
  input: string[] | Record<string, unknown>
): SyncCategoryMeta[] {
  const keys = Array.isArray(input) ? input : Object.keys(input)
  const result: SyncCategoryMeta[] = []
  const seen = new Set<string>()

  for (const raw of keys) {
    if (!raw || raw.startsWith("_")) continue
    if (isDatabaseTable(raw)) {
      const label = getTableDisplayName(raw)
      const baseKey = cleanModelKey(raw)
      if (label && !seen.has(label)) {
        seen.add(label)
        result.push({ key: baseKey || raw, label })
      }
    }
  }

  return result
}

