import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"

/** Bump khi thay đổi cấu trúc gói JSON — portal phải hỗ trợ version này */
export const EXPORT_TRAINING_DATA_VERSION = "1.4.0"

export type ExportTrainingDataParams = {
  /** Giữ tương thích API cũ — không còn lọc theo 1 đợt; luôn xuất toàn bộ */
  classRegisterSessionId?: string
}

type JoinRow = {
  A: string
  B: string
}

const notDeleted = { deletedAt: null } as const

function uniqueIds(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))]
}

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

async function queryJoinTable(table: string) {
  return prisma.$queryRawUnsafe<JoinRow[]>(`SELECT "A", "B" FROM "ql-dao-tao"."${table}"`)
}

/**
 * Xuất toàn bộ dữ liệu phục vụ đồng bộ nội bộ → internet:
 * đợt đăng ký, lớp HP, TKB, SV + hồ sơ, danh mục, CTĐT/môn, điểm mọi kỳ.
 */
export async function exportTrainingData(_params: ExportTrainingDataParams = {}) {
  const [
    catalogs,
    classRegisterSessions,
    classRegisterSessionCredits,
    sessionToTrainingCourse,
    trainingObjectTypes,
    schoolYears,
    semesters,
    trainingCourses,
    trainingCourseRegulations,
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
    lecturers,
    staff,
    fixedClasses,
    students,
    exams,
    subjectClasses,
    subjectClassTimes,
    classSchedules,
    studentSubjectScores,
    studentSemesterResults,
    fixedClassToSubjectClass,
  ] = await Promise.all([
    loadAllCatalogs(),
    prisma.classRegisterSession.findMany({ where: notDeleted }),
    prisma.classRegisterSessionCredit.findMany({ where: notDeleted }),
    queryJoinTable("_ClassRegisterSessionToTrainingCourse"),
    prisma.trainingObjectType.findMany({ where: notDeleted }),
    prisma.schoolYear.findMany({ where: notDeleted }),
    prisma.semester.findMany({ where: notDeleted }),
    prisma.trainingCourse.findMany({ where: notDeleted }),
    prisma.trainingCourseRegulation.findMany({ where: notDeleted }),
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
    prisma.lecturer.findMany({ where: notDeleted }),
    prisma.staff.findMany({ where: notDeleted }),
    prisma.fixedClass.findMany({ where: notDeleted }),
    prisma.student.findMany({ where: notDeleted }),
    prisma.exam.findMany({ where: notDeleted }),
    prisma.subjectClass.findMany({ where: notDeleted }),
    prisma.subjectClassTime.findMany({ where: notDeleted }),
    prisma.classSchedule.findMany({ where: notDeleted }),
    prisma.studentSubjectScore.findMany({ where: notDeleted }),
    prisma.studentSemesterResult.findMany({ where: notDeleted }),
    queryJoinTable("_FixedClassToSubjectClass"),
  ])

  const userProfileIds = uniqueIds([
    ...lecturers.map((l) => l.userProfileId),
    ...students.map((s) => s.userProfileId),
    ...staff.map((s) => s.userProfileId),
  ])

  const userProfiles: Awaited<ReturnType<typeof prisma.userProfile.findMany>> = []
  const PROFILE_CHUNK = 5000
  for (let i = 0; i < userProfileIds.length; i += PROFILE_CHUNK) {
    const chunk = userProfileIds.slice(i, i + PROFILE_CHUNK)
    const rows = await prisma.userProfile.findMany({
      where: { id: { in: chunk }, deletedAt: null },
    })
    userProfiles.push(...rows)
  }

  const subjectClassRecordsNormalized = subjectClasses.map((sc) => ({
    ...sc,
    scoreLinkSubjectVersionId: null,
  }))

  const data = {
    ...catalogs,
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
    SubjectClass: subjectClassRecordsNormalized,
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
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
  )

  return serializeForJson({
    version: EXPORT_TRAINING_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    filters: {
      scope: "full",
      classRegisterSessionIds: classRegisterSessions.map((s) => s.id),
      semesterIds: semesters.map((s) => s.id),
      trainingCourseIds: trainingCourses.map((tc) => tc.id),
    },
    counts,
    data,
  }) as {
    version: string
    exportedAt: string
    filters: {
      scope: "full"
      classRegisterSessionIds: string[]
      semesterIds: string[]
      trainingCourseIds: string[]
    }
    counts: Record<string, number>
    data: typeof data
  }
}
