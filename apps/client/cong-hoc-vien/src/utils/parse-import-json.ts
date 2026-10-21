export type ImportJsonPreview = {
  version: string
  exportedAt?: string
  sessionId: string
  sessionName: string
  semesterName?: string
  schoolYearName?: string
  startDate?: string
  endDate?: string
  active?: boolean
  tuitionPerCredit?: number
  recordCounts?: Record<string, number>
  trainingCourses: Array<{ id?: string; code?: string; name?: string }>
  creditLimits: Array<{
    minCredit?: number | null
    maxCredit?: number | null
    baseScore?: string | null
    base4Min?: number | null
    base4Max?: number | null
    base10Min?: number | null
    base10Max?: number | null
  }>
  subjectClasses: Array<{
    code?: string
    name?: string
    type?: string
    status?: string
    maxStudent?: number
    enrolledCount?: number
    roomId?: string
    schedule?: string
  }>
  classTimes: Array<{
    classCode?: string
    className?: string
    dayOfWeek?: number
    startPeriod?: number
    endPeriod?: number
  }>
  schedules: Array<{
    classCode?: string
    className?: string
    classDate?: string
    startPeriod?: number
    endPeriod?: number
    roomId?: string
    periodType?: string
  }>
  students: Array<{
    code?: string
    fullName?: string
    fixedClass?: string
    status?: string
  }>
  fixedClasses: Array<{ code?: string; name?: string }>
  catalogs: Array<{ key: string; label: string; count: number }>
  curricula: Array<{ code?: string; name?: string }>
  subjects: Array<{ code?: string; name?: string; credit?: number; type?: string }>
  summary: {
    subjectClassCount: number
    scheduleCount: number
    classTimeCount: number
    studentCount: number
    userProfileCount: number
    catalogCount: number
    curriculumCount: number
    subjectCount: number
    trainingCourseCount: number
  }
}

type JsonRecord = Record<string, unknown>

type ExportJsonShape = {
  version?: string
  exportedAt?: string
  counts?: Record<string, number>
  data?: Record<string, JsonRecord[] | undefined>
}

const STUDENT_STATUS_LABEL: Record<string, string> = {
  ENROLLED: "Đang học",
  GRADUATED: "Tốt nghiệp",
  DEFERRED_STUDY: "Bảo lưu",
  SUSPENDED_STUDY: "Tạm ngưng học",
  WITHDRAWN: "Thôi học",
  TRANSFERRED: "Chuyển trường",
  PENDING_GRADUATION_REVIEW: "Chờ xét tốt nghiệp",
  ACADEMIC_SUSPENSION: "Đình chỉ học",
  REPEATED: "Lưu ban",
}

const CATALOG_LABELS: Record<string, string> = {
  DM_CapBac: "Cấp bậc",
  DM_ChucDanh: "Chức danh",
  DM_ChucVu: "Chức vụ",
  DM_HocHam: "Học hàm",
  DM_HocVi: "Học vị",
  DM_DanToc: "Dân tộc",
  DM_DonVi: "Đơn vị",
  DM_TonGiao: "Tôn giáo",
  DM_GioiTinh: "Giới tính",
  DM_QuocGia: "Quốc gia",
  DM_Tinh: "Tỉnh/TP",
  DM_Tinh_New: "Tỉnh/TP (mới)",
  DM_QuanHuyen: "Quận/Huyện",
  DM_XaPhuong: "Xã/Phường",
  DM_XaPhuong_New: "Xã/Phường (mới)",
  DM_TruongDaoTaoBacDH: "Trường ĐH",
  DM_ChuyenNganhDaoTaoBacDH: "Chuyên ngành ĐH",
  DM_NganhHoc: "Ngành học",
  LecturerType: "Loại giảng viên",
  TrainingLanguage: "Ngôn ngữ đào tạo",
  TrainingType: "Loại hình đào tạo",
  TrainingLevel: "Trình độ đào tạo",
  TrainingForm: "Hình thức đào tạo",
  TrainingTime: "Thời gian đào tạo",
  DiplomaType: "Loại văn bằng",
  TrainingField: "Ngành đào tạo",
  AcademicRankingConvert: "Quy đổi xếp loại",
  TemplateFile: "Biểu mẫu",
  TrainingObjectType: "Đối tượng đào tạo",
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : []
}

function str(row: JsonRecord | undefined, key: string) {
  const value = row?.[key]
  return typeof value === "string" ? value : value == null ? undefined : String(value)
}

function num(row: JsonRecord | undefined, key: string) {
  const value = row?.[key]
  return typeof value === "number" ? value : undefined
}

function countOf(counts: Record<string, number> | undefined, key: string, fallback = 0) {
  return counts?.[key] ?? fallback
}

const ENUM_LABELS: Record<string, string> = {
  ...STUDENT_STATUS_LABEL,
  NORMAL: "Bình thường",
  LINKED: "Liên kết",
  REEXAM: "Thi lại",
  RETAKE: "Học lại",
  STAYBACK: "Lưu ban",
  TRANSFER: "Chuyển trường",
  DRAFT: "Nháp",
  OFFICIAL: "Giảng dạy",
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  THEORY: "Lý thuyết",
  PRACTICE: "Thực hành",
  LAB: "Thí nghiệm",
  SEMINAR: "Seminar",
  EXAM: "Thi",
  MAKEUP: "Học bù",
  REVIEW: "Ôn tập",
  CHECK: "Kiểm tra",
  WEEK: "Tuần",
  Normal: "Thường",
  Practice: "Thực hành",
  Internship: "Thực tập",
  Research: "Nghiên cứu",
  Project: "Đồ án",
  Thesis: "Luận văn",
  Graduation: "Tốt nghiệp",
  Base4: "Hệ 4",
  Base10: "Hệ 10",
}

export function studentStatusLabel(status?: string) {
  return enumLabel(status)
}

export function enumLabel(value?: string | null) {
  if (!value) return ""
  return ENUM_LABELS[value] || value
}

export function dayOfWeekLabel(day?: number) {
  if (!day) return ""
  if (day === 8) return "CN"
  return `Thứ ${day}`
}

export async function parseImportJsonFile(file: File): Promise<ImportJsonPreview> {
  const text = await file.text()
  let json: ExportJsonShape

  try {
    json = JSON.parse(text) as ExportJsonShape
  } catch {
    throw new Error("File JSON không hợp lệ")
  }

  const data = json.data ?? {}
  const sessions = asRecords(data.ClassRegisterSession)
  const session = sessions[0]
  if (!str(session, "id") || !str(session, "name")) {
    throw new Error("Không tìm thấy thông tin đợt đăng ký (ClassRegisterSession) trong file")
  }

  const semesters = asRecords(data.Semester)
  const schoolYears = asRecords(data.SchoolYear)
  const semester =
    semesters.find((s) => str(s, "id") === str(session, "semesterId")) ?? semesters[0]
  const schoolYear = schoolYears[0]

  const subjectClassesRaw = asRecords(data.SubjectClass)
  const subjectClassById = new Map(
    subjectClassesRaw.map((row) => [str(row, "id") || "", row] as const)
  )
  const profilesById = new Map(
    asRecords(data.UserProfile).map((row) => [str(row, "id") || "", row] as const)
  )
  const fixedClassById = new Map(
    asRecords(data.FixedClass).map((row) => [str(row, "id") || "", row] as const)
  )

  const subjectClasses = subjectClassesRaw.map((row) => ({
    code: str(row, "code"),
    name: str(row, "name"),
    type: str(row, "type"),
    status: str(row, "status"),
    maxStudent: num(row, "maxStudent"),
    enrolledCount: num(row, "enrolledCount"),
    roomId: str(row, "roomId"),
    schedule: str(row, "schedule"),
  }))

  const classTimes = asRecords(data.SubjectClassTime).map((row) => {
    const sc = subjectClassById.get(str(row, "subjectClassId") || "")
    return {
      classCode: str(sc, "code"),
      className: str(sc, "name"),
      dayOfWeek: num(row, "dayOfWeek"),
      startPeriod: num(row, "startPeriod"),
      endPeriod: num(row, "endPeriod"),
    }
  })

  const schedules = asRecords(data.ClassSchedule).map((row) => {
    const sc = subjectClassById.get(str(row, "subjectClassId") || "")
    return {
      classCode: str(sc, "code"),
      className: str(sc, "name"),
      classDate: str(row, "classDate"),
      startPeriod: num(row, "startPeriod"),
      endPeriod: num(row, "endPeriod"),
      roomId: str(row, "roomId"),
      periodType: str(row, "periodType"),
    }
  })

  const students = asRecords(data.Student).map((row) => {
    const profile = profilesById.get(str(row, "userProfileId") || "")
    const fixedClass = fixedClassById.get(str(row, "fixedClassId") || "")
    return {
      code: str(row, "code"),
      fullName: str(profile, "fullname") || [str(profile, "lastName"), str(profile, "firstName")].filter(Boolean).join(" "),
      fixedClass: str(fixedClass, "code") || str(fixedClass, "name"),
      status: str(row, "status"),
    }
  })

  const catalogs = Object.entries(json.counts ?? {})
    .filter(([key, count]) => (key.startsWith("DM_") || key in CATALOG_LABELS) && count > 0)
    .filter(([key]) => !["ClassRegisterSession", "ClassRegisterSessionCredit", "Student", "UserProfile", "SubjectClass", "ClassSchedule", "SubjectClassTime", "Curriculum", "CurriculumVersion", "Subject", "SubjectVersion", "TrainingCourse", "FixedClass", "Lecturer", "Staff"].includes(key))
    .map(([key, count]) => ({
      key,
      label: CATALOG_LABELS[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"))

  const curricula = asRecords(data.Curriculum).map((row) => ({
    code: str(row, "code"),
    name: str(row, "name"),
  }))

  const subjects = asRecords(data.SubjectVersion).map((row) => ({
    code: str(row, "code"),
    name: str(row, "name"),
    credit: num(row, "credit"),
    type: str(row, "type"),
  }))

  const trainingCourses = asRecords(data.TrainingCourse).map((row) => ({
    id: str(row, "id"),
    code: str(row, "code"),
    name: str(row, "name"),
  }))

  const targetSessionId = str(session, "id")
  const sessionCredits = asRecords(data.ClassRegisterSessionCredit).filter(
    (row) => !str(row, "classRegisterSessionId") || str(row, "classRegisterSessionId") === targetSessionId
  )
  const creditLimits = (sessionCredits.length > 0 ? sessionCredits : asRecords(data.ClassRegisterSessionCredit)).map((row) => ({
    minCredit: num(row, "minCredit") ?? null,
    maxCredit: num(row, "maxCredit") ?? null,
    baseScore: str(row, "baseScore") ?? null,
    base4Min: num(row, "base4Min") ?? null,
    base4Max: num(row, "base4Max") ?? null,
    base10Min: num(row, "base10Min") ?? null,
    base10Max: num(row, "base10Max") ?? null,
  }))

  const counts = json.counts ?? {}

  return {
    version: json.version ?? "—",
    exportedAt: json.exportedAt,
    sessionId: str(session, "id") || "",
    sessionName:
      sessions.length > 1
        ? `${str(session, "name")} (+${sessions.length - 1} đợt)`
        : str(session, "name") || "",
    semesterName: str(semester, "name"),
    schoolYearName: str(schoolYear, "name"),
    startDate: str(session, "startDate"),
    endDate: str(session, "endDate"),
    active: typeof session.active === "boolean" ? session.active : undefined,
    tuitionPerCredit: num(session, "tuitionPerCredit"),
    recordCounts: counts,
    trainingCourses,
    creditLimits,
    subjectClasses,
    classTimes,
    schedules,
    students,
    fixedClasses: asRecords(data.FixedClass).map((row) => ({
      code: str(row, "code"),
      name: str(row, "name"),
    })),
    catalogs,
    curricula,
    subjects,
    summary: {
      subjectClassCount: countOf(counts, "SubjectClass", subjectClasses.length),
      scheduleCount: countOf(counts, "ClassSchedule", schedules.length),
      classTimeCount: countOf(counts, "SubjectClassTime", classTimes.length),
      studentCount: countOf(counts, "Student", students.length),
      userProfileCount: countOf(counts, "UserProfile", profilesById.size),
      catalogCount: catalogs.reduce((sum, item) => sum + item.count, 0),
      curriculumCount: countOf(counts, "Curriculum", curricula.length),
      subjectCount: countOf(counts, "SubjectVersion", subjects.length),
      trainingCourseCount: countOf(counts, "TrainingCourse", trainingCourses.length),
    },
  }
}
