import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"
import {
  loadSessionScopedEntities,
  notDeleted,
  queryJoinTable,
  uniqueIds,
} from "./export-session-scope"
import { loadWarningAndScholarshipData } from "./export-warning-scholarship"

/** Bump khi thay đổi cấu trúc gói — 1.6.0: JSON bên trong, file tải về Gzip+AES-GCM (.dat) */
export const EXPORT_TRAINING_DATA_VERSION = "1.6.0"

function serializeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serializeForJson)
  if (typeof value === "object") {
    const maybeDecimal = value as { toJSON?: () => unknown }
    if (typeof maybeDecimal.toJSON === "function") {
      return maybeDecimal.toJSON()
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeForJson(nested)])
    )
  }
  return value
}

export type ExportTrainingDataParams = {
  classRegisterSessionId?: string
}

/**
 * Xuất toàn bộ dữ liệu phục vụ đồng bộ nội bộ → internet:
 * đợt đăng ký, lớp HP, TKB, SV + hồ sơ, danh mục, CTĐT/môn, điểm mọi kỳ.
 */
export async function exportTrainingData(params: ExportTrainingDataParams = {}) {
  const { classRegisterSessionId } = params

  const targetSession = classRegisterSessionId
    ? await prisma.classRegisterSession.findFirst({
        where: { id: classRegisterSessionId, deletedAt: null },
        include: {
          trainingCourses: { where: notDeleted },
          creditLimit: { where: notDeleted },
          semester: { include: { schoolYear: true } },
        },
      })
    : null

  if (classRegisterSessionId && !targetSession) {
    throw new Error(`Không tìm thấy đợt đăng ký học với ID: ${classRegisterSessionId}`)
  }

  const [
    catalogs,
    trainingObjectTypes,
    trainingLocations,
    buildings,
    rooms,
    trainingMajors,
    curriculums,
    curriculumVersions,
    trainingBlocks,
    trainingBlockOnCvs,
    trainingBlockSubjects,
    subjects,
    subjectVersions,
    equivalencyGroups,
    subjectInGroups,
    prerequisiteJoins,
    coRequisiteJoins,
  ] = await Promise.all([
    loadAllCatalogs(),
    prisma.trainingObjectType.findMany({ where: notDeleted }),
    prisma.trainingLocation.findMany({ where: notDeleted }),
    prisma.building.findMany({ where: notDeleted }),
    prisma.room.findMany({ where: notDeleted }),
    prisma.trainingMajor.findMany({ where: notDeleted }),
    prisma.curriculum.findMany({ where: notDeleted }),
    prisma.curriculumVersion.findMany({ where: notDeleted }),
    prisma.trainingBlock.findMany({ where: notDeleted }),
    prisma.trainingBlockOnCurriculumVersion.findMany({ where: notDeleted }),
    prisma.trainingBlockSubject.findMany({ where: notDeleted }),
    prisma.subject.findMany({ where: notDeleted }),
    prisma.subjectVersion.findMany({ where: notDeleted }),
    prisma.equivalencyGroup.findMany({ where: notDeleted }),
    prisma.subjectInGroup.findMany({ where: notDeleted }),
    queryJoinTable("_PrerequisiteSubject"),
    queryJoinTable("_CoRequisiteSubject"),
  ])

  const cleanSession = targetSession
    ? (() => {
        const { trainingCourses: _tc, creditLimit: _cl, semester: _sem, ...rest } = targetSession
        return rest
      })()
    : null

  const classRegisterSessions = cleanSession
    ? [cleanSession]
    : await prisma.classRegisterSession.findMany({ where: notDeleted })

  const classRegisterSessionCredits = targetSession
    ? targetSession.creditLimit
    : await prisma.classRegisterSessionCredit.findMany({ where: notDeleted })

  const allSessionToCourses = await queryJoinTable("_ClassRegisterSessionToTrainingCourse")
  const sessionToTrainingCourse = classRegisterSessionId
    ? allSessionToCourses.filter((r) => r.A === classRegisterSessionId)
    : allSessionToCourses

  const [semesters, schoolYears] = await Promise.all([
    prisma.semester.findMany({ where: notDeleted }),
    prisma.schoolYear.findMany({ where: notDeleted }),
  ])

  let trainingCourses: Array<Record<string, unknown> & { id: string }>
  let trainingCourseRegulations: Awaited<ReturnType<typeof prisma.trainingCourseRegulation.findMany>>
  let subjectClasses: Awaited<ReturnType<typeof prisma.subjectClass.findMany>>
  let subjectClassTimes: Awaited<ReturnType<typeof prisma.subjectClassTime.findMany>>
  let classSchedules: Awaited<ReturnType<typeof prisma.classSchedule.findMany>>
  let exams: Awaited<ReturnType<typeof prisma.exam.findMany>>
  let fixedClassToSubjectClass: Awaited<ReturnType<typeof queryJoinTable>>
  let fixedClasses: Awaited<ReturnType<typeof prisma.fixedClass.findMany>>
  let students: Awaited<ReturnType<typeof prisma.student.findMany>>
  let lecturers: Awaited<ReturnType<typeof prisma.lecturer.findMany>>
  let staff: Awaited<ReturnType<typeof prisma.staff.findMany>>
  let userProfiles: Awaited<ReturnType<typeof prisma.userProfile.findMany>>
  let studentSubjectScores: Awaited<ReturnType<typeof prisma.studentSubjectScore.findMany>>
  let studentSemesterResults: Awaited<ReturnType<typeof prisma.studentSemesterResult.findMany>>
  let studentIds: string[]
  let exportedCourseIds: string[]

  if (targetSession) {
    const scoped = await loadSessionScopedEntities(targetSession)
    trainingCourses = scoped.trainingCourses
    trainingCourseRegulations = scoped.trainingCourseRegulations
    fixedClasses = scoped.fixedClasses
    students = scoped.students
    subjectClasses = scoped.subjectClasses
    subjectClassTimes = scoped.subjectClassTimes
    classSchedules = scoped.classSchedules
    exams = scoped.exams
    fixedClassToSubjectClass = scoped.fixedClassToSubjectClass
    lecturers = scoped.lecturers
    staff = scoped.staff
    userProfiles = scoped.userProfiles
    studentSubjectScores = scoped.studentSubjectScores
    studentSemesterResults = scoped.studentSemesterResults
    studentIds = scoped.studentIds
    exportedCourseIds = scoped.targetCourseIds
  } else {
    trainingCourses = await prisma.trainingCourse.findMany({ where: notDeleted })
    trainingCourseRegulations = await prisma.trainingCourseRegulation.findMany({
      where: notDeleted,
    })
    subjectClasses = await prisma.subjectClass.findMany({ where: notDeleted })
    const [times, schedules, joins, examRows] = await Promise.all([
      prisma.subjectClassTime.findMany({ where: notDeleted }),
      prisma.classSchedule.findMany({ where: notDeleted }),
      queryJoinTable("_FixedClassToSubjectClass"),
      prisma.exam.findMany({ where: notDeleted }),
    ])
    subjectClassTimes = times
    classSchedules = schedules
    fixedClassToSubjectClass = joins
    exams = examRows
    fixedClasses = await prisma.fixedClass.findMany({ where: notDeleted })
    students = await prisma.student.findMany({ where: notDeleted })
    lecturers = await prisma.lecturer.findMany({ where: notDeleted })
    staff = await prisma.staff.findMany({ where: notDeleted })
    const userProfileIds = uniqueIds([
      ...lecturers.map((l) => l.userProfileId),
      ...students.map((s) => s.userProfileId),
      ...staff.map((s) => s.userProfileId),
    ])
    userProfiles = []
    const PROFILE_CHUNK = 5000
    for (let i = 0; i < userProfileIds.length; i += PROFILE_CHUNK) {
      const chunk = userProfileIds.slice(i, i + PROFILE_CHUNK)
      const rows = await prisma.userProfile.findMany({
        where: { id: { in: chunk }, deletedAt: null },
      })
      userProfiles.push(...rows)
    }
    studentIds = uniqueIds(students.map((s) => s.id))
    exportedCourseIds = trainingCourses.map((tc) => tc.id)
    ;[studentSubjectScores, studentSemesterResults] = await Promise.all([
      prisma.studentSubjectScore.findMany({ where: notDeleted }),
      prisma.studentSemesterResult.findMany({ where: notDeleted }),
    ])
  }

  const warningScholarship = await loadWarningAndScholarshipData({
    studentIds,
    trainingCourseIds: exportedCourseIds,
    scoped: Boolean(targetSession),
  })

  // AcademicRankingConvert gắn trainingCourseId — khi export theo đợt chỉ lấy xếp hạng của khoá trong đợt,
  // tránh upsert portal fail FK (TrainingCourse ngoài scope không có trong file).
  const courseIdSet = new Set(exportedCourseIds)
  const academicRankingConvert = (
    (catalogs.AcademicRankingConvert ?? []) as Array<{ trainingCourseId?: string | null }>
  ).filter((row) => row.trainingCourseId != null && courseIdSet.has(row.trainingCourseId))

  // SubjectVersion upsert trước SubjectClass trên portal — giữ nguyên scoreLinkSubjectVersionId
  const data = {
    ...catalogs,
    AcademicRankingConvert: academicRankingConvert,
    ClassRegisterSession: classRegisterSessions,
    ClassRegisterSessionCredit: classRegisterSessionCredits,
    _ClassRegisterSessionToTrainingCourse: sessionToTrainingCourse,
    UserProfile: userProfiles,
    Student: students,
    Lecturer: lecturers,
    Staff: staff,
    TrainingObjectType: trainingObjectTypes,
    SchoolYear: schoolYears,
    Semester: semesters,
    TrainingCourse: trainingCourses,
    TrainingCourseRegulation: trainingCourseRegulations,
    Subject: subjects,
    SubjectVersion: subjectVersions,
    _PrerequisiteSubject: prerequisiteJoins,
    _CoRequisiteSubject: coRequisiteJoins,
    EquivalencyGroup: equivalencyGroups,
    SubjectInGroup: subjectInGroups,
    TrainingBlock: trainingBlocks,
    TrainingBlockOnCurriculumVersion: trainingBlockOnCvs,
    TrainingBlockSubject: trainingBlockSubjects,
    SubjectClass: subjectClasses,
    SubjectClassTime: subjectClassTimes,
    FixedClass: fixedClasses,
    _FixedClassToSubjectClass: fixedClassToSubjectClass,
    Room: rooms,
    Building: buildings,
    TrainingLocation: trainingLocations,
    TrainingMajor: trainingMajors,
    Curriculum: curriculums,
    CurriculumVersion: curriculumVersions,
    StudentSubjectScore: studentSubjectScores,
    StudentSemesterResult: studentSemesterResults,
    Exam: exams,
    ClassSchedule: classSchedules,
    ...warningScholarship,
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
  )

  const finalSession = targetSession || classRegisterSessions[0]
  // API sync trả JSON (đã auth). File tải về người dùng dùng luồng async → .dat (gzip+AES).
  return serializeForJson({
    version: EXPORT_TRAINING_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    filters: {
      scope: classRegisterSessionId ? "session" : "full",
      classRegisterSessionIds: classRegisterSessions.map((s) => s.id),
      semesterIds: classRegisterSessionId && finalSession
        ? [finalSession.semesterId]
        : semesters.map((s) => s.id),
      trainingCourseIds: classRegisterSessionId
        ? sessionToTrainingCourse.map((tc) => tc.B)
        : trainingCourses.map((tc) => tc.id),
    },
    counts,
    data,
  }) as {
    version: string
    exportedAt: string
    filters: {
      scope: "full" | "session"
      classRegisterSessionIds: string[]
      semesterIds: string[]
      trainingCourseIds: string[]
    }
    counts: Record<string, number>
    data: typeof data
  }
}
