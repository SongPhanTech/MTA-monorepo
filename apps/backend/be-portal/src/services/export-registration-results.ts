import { prisma } from "../prisma"

export const EXPORT_REGISTRATION_RESULTS_VERSION = "1.0.0"

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

export async function exportRegistrationResults(classRegisterSessionId: string) {
  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
    include: {
      semester: { include: { schoolYear: true } },
      trainingCourses: { where: { deletedAt: null }, select: { id: true } },
    },
  })

  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học")
  }

  const classRegisterLogs = await prisma.classRegisterLogs.findMany({
    where: { classRegisterSessionId, deletedAt: null },
  })

  const studentIds = uniqueIds(classRegisterLogs.map((log) => log.studentId))
  const subjectClassIds = uniqueIds(classRegisterLogs.map((log) => log.subjectClassId))

  const [students, subjectClasses, studentSubjectScores] = await Promise.all([
    studentIds.length > 0
      ? prisma.student.findMany({ where: { id: { in: studentIds }, deletedAt: null } })
      : Promise.resolve([]),
    subjectClassIds.length > 0
      ? prisma.subjectClass.findMany({ where: { id: { in: subjectClassIds }, deletedAt: null } })
      : Promise.resolve([]),
    studentIds.length > 0 && subjectClassIds.length > 0
      ? prisma.studentSubjectScore.findMany({
          where: {
            deletedAt: null,
            studentId: { in: studentIds },
            subjectClassId: { in: subjectClassIds },
          },
        })
      : Promise.resolve([]),
  ])

  const userProfileIds = uniqueIds(students.map((s) => s.userProfileId))
  const subjectVersionIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.subjectId),
    ...studentSubjectScores.map((score) => score.subjectVersionId),
  ])

  const [userProfiles, subjectVersions] = await Promise.all([
    userProfileIds.length > 0
      ? prisma.userProfile.findMany({ where: { id: { in: userProfileIds }, deletedAt: null } })
      : Promise.resolve([]),
    subjectVersionIds.length > 0
      ? prisma.subjectVersion.findMany({
          where: { id: { in: subjectVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  const { semester, trainingCourses, ...sessionRecord } = session

  const { schoolYear, ...semesterRecord } = semester

  const data = {
    ClassRegisterSession: [sessionRecord],
    Semester: [semesterRecord],
    SchoolYear: schoolYear ? [schoolYear] : [],
    ClassRegisterLogs: classRegisterLogs,
    StudentSubjectScore: studentSubjectScores,
    Student: students,
    UserProfile: userProfiles,
    SubjectClass: subjectClasses,
    SubjectVersion: subjectVersions,
    _ClassRegisterSessionToTrainingCourse: trainingCourses.map((tc) => ({
      A: classRegisterSessionId,
      B: tc.id,
    })),
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
  )

  const now = new Date()
  const isEnded = session.endDate < now || !session.active

  return serializeForJson({
    version: EXPORT_REGISTRATION_RESULTS_VERSION,
    type: "registration-results",
    exportedAt: now.toISOString(),
    filters: {
      classRegisterSessionId,
      semesterId: session.semesterId,
    },
    meta: {
      sessionName: session.name,
      sessionActive: session.active,
      sessionEnded: isEnded,
      startDate: session.startDate,
      endDate: session.endDate,
      registrationCount: classRegisterLogs.length,
    },
    counts,
    data,
  }) as {
    version: string
    type: "registration-results"
    exportedAt: string
    filters: {
      classRegisterSessionId: string
      semesterId: string
    }
    meta: {
      sessionName: string
      sessionActive: boolean
      sessionEnded: boolean
      startDate: string
      endDate: string
      registrationCount: number
    }
    counts: Record<string, number>
    data: typeof data
  }
}
