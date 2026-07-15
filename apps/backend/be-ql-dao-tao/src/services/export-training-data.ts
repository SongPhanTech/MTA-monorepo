import type { Prisma } from "@workspace/db"
import { Prisma as PrismaNamespace } from "@workspace/db"
import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"

export const EXPORT_TRAINING_DATA_VERSION = "1.3.2"

export type ExportTrainingDataParams = {
  classRegisterSessionId: string
}

type JoinRow = {
  A: string
  B: string
}

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

async function queryFixedClassToSubjectClass(subjectClassIds: string[]) {
  if (subjectClassIds.length === 0) return []

  return prisma.$queryRaw<JoinRow[]>`
    SELECT "A", "B"
    FROM "ql-dao-tao"."_FixedClassToSubjectClass"
    WHERE "B" IN (${PrismaNamespace.join(subjectClassIds)})
  `
}

async function querySessionToTrainingCourse(sessionId: string) {
  return prisma.$queryRaw<JoinRow[]>`
    SELECT "A", "B"
    FROM "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"
    WHERE "A" = ${sessionId}
  `
}

async function loadStudents(params: {
  fixedClassIds: string[]
  trainingCourseIds: string[]
  fixedClasses: { classMonitorId: string | null; unionLeaderId: string | null; deputyUnionSecretaryId: string | null; unionSecretaryId: string | null }[]
  extraStudentIds: string[]
}) {
  const { fixedClassIds, trainingCourseIds, fixedClasses, extraStudentIds } = params

  const roleStudentIds = uniqueIds([
    ...fixedClasses.map((fc) => fc.classMonitorId),
    ...fixedClasses.map((fc) => fc.unionLeaderId),
    ...fixedClasses.map((fc) => fc.deputyUnionSecretaryId),
    ...fixedClasses.map((fc) => fc.unionSecretaryId),
    ...extraStudentIds,
  ])

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    OR: [
      ...(fixedClassIds.length > 0 ? [{ fixedClassId: { in: fixedClassIds } }] : []),
      ...(trainingCourseIds.length > 0
        ? [{ fixedClass: { trainingCourseId: { in: trainingCourseIds } } }]
        : []),
      ...(roleStudentIds.length > 0 ? [{ id: { in: roleStudentIds } }] : []),
    ],
  }

  if (!where.OR || where.OR.length === 0) return []

  return prisma.student.findMany({ where })
}

export async function exportTrainingData(params: ExportTrainingDataParams) {
  const { classRegisterSessionId } = params

  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
    include: {
      trainingCourses: true,
      creditLimit: { where: { deletedAt: null } },
      semester: { include: { schoolYear: true } },
    },
  })

  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học")
  }

  const semesterId = session.semesterId
  const trainingCourses = session.trainingCourses.filter((tc) => !tc.deletedAt)
  const trainingCourseIds = uniqueIds(trainingCourses.map((tc) => tc.id))
  const trainingObjectTypeIds = uniqueIds(trainingCourses.map((tc) => tc.trainingObjectTypeId))

  if (trainingCourseIds.length === 0) {
    throw new Error("Đợt đăng ký chưa gắn khóa học")
  }

  const sessionToTrainingCourse = await querySessionToTrainingCourse(classRegisterSessionId)

  const subjectClassWhere: Prisma.SubjectClassWhereInput = {
    semesterId,
    deletedAt: null,
    cancelled: false,
    status: "OFFICIAL",
    active: true,
    ...(trainingObjectTypeIds.length > 0
      ? { trainingObjectTypeId: { in: trainingObjectTypeIds } }
      : {}),
    OR: [
      { fixedClasses: { some: { trainingCourseId: { in: trainingCourseIds } } } },
      { fixedClasses: { none: {} } },
    ],
  }

  const subjectClasses = await prisma.subjectClass.findMany({
    where: subjectClassWhere,
    select: {
      id: true,
      subjectId: true,
      lecturerId: true,
      extraLecturerId: true,
      enterGradeLecturerId: true,
      roomId: true,
      trainingLocationId: true,
      examId: true,
    },
  })

  const subjectClassIds = subjectClasses.map((sc) => sc.id)
  const subjectVersionIds = uniqueIds(subjectClasses.map((sc) => sc.subjectId))

  const fixedClassToSubjectClass = await queryFixedClassToSubjectClass(subjectClassIds)

  const fixedClasses = await prisma.fixedClass.findMany({
    where: {
      deletedAt: null,
      trainingCourseId: { in: trainingCourseIds },
    },
  })
  const fixedClassIds = uniqueIds(fixedClasses.map((fc) => fc.id))

  const [
    subjectClassTimes,
    classSchedules,
    subjectVersions,
    schoolYear,
    semesterRecord,
    trainingObjectTypes,
  ] = await Promise.all([
    subjectClassIds.length > 0
      ? prisma.subjectClassTime.findMany({
          where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    subjectClassIds.length > 0
      ? prisma.classSchedule.findMany({
          where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    subjectVersionIds.length > 0
      ? prisma.subjectVersion.findMany({
          where: { id: { in: subjectVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    prisma.schoolYear.findUniqueOrThrow({ where: { id: session.semester.schoolYearId } }),
    prisma.semester.findUniqueOrThrow({ where: { id: semesterId } }),
    trainingObjectTypeIds.length > 0
      ? prisma.trainingObjectType.findMany({
          where: { id: { in: trainingObjectTypeIds } },
        })
      : Promise.resolve([]),
  ])

  const subjectIds = uniqueIds(subjectVersions.map((sv) => sv.subjectId))

  const [subjects, subjectClassRecords, studentSubjectScores, exams] = await Promise.all([
      subjectIds.length > 0
        ? prisma.subject.findMany({ where: { id: { in: subjectIds }, deletedAt: null } })
        : Promise.resolve([]),
      subjectClassIds.length > 0
        ? prisma.subjectClass.findMany({ where: { id: { in: subjectClassIds } } })
        : Promise.resolve([]),
      subjectClassIds.length > 0
        ? prisma.studentSubjectScore.findMany({
            where: {
              deletedAt: null,
              OR: [
                { subjectClassId: { in: subjectClassIds } },
                { semesterId },
              ],
            },
          })
        : Promise.resolve([]),
      subjectClassIds.length > 0 || subjectVersionIds.length > 0
        ? prisma.exam.findMany({
            where: {
              semesterId,
              deletedAt: null,
              OR: [
                ...(subjectClassIds.length > 0
                  ? [{ subjectClass: { some: { id: { in: subjectClassIds } } } }]
                  : []),
                ...(subjectVersionIds.length > 0
                  ? [{ subjectVersionId: { in: subjectVersionIds } }]
                  : []),
              ],
            },
          })
        : Promise.resolve([]),
    ])

  const scoreStudentIds = uniqueIds(studentSubjectScores.map((s) => s.studentId))

  const students = await loadStudents({
    fixedClassIds,
    trainingCourseIds,
    fixedClasses,
    extraStudentIds: scoreStudentIds,
  })

  const studentIds = uniqueIds(students.map((s) => s.id))

  const studentSemesterResultsResolved =
    studentIds.length > 0
      ? await prisma.studentSemesterResult.findMany({
          where: { studentId: { in: studentIds }, deletedAt: null },
        })
      : []

  // Bổ sung SubjectVersion / Subject còn thiếu từ điểm lịch sử (điều kiện tiên quyết)
  const scoreSubjectVersionIds = uniqueIds([
    ...subjectVersionIds,
    ...studentSubjectScores.map((s) => s.subjectVersionId),
  ])
  const missingSubjectVersionIds = scoreSubjectVersionIds.filter(
    (id) => !subjectVersionIds.includes(id)
  )

  const extraSubjectVersions =
    missingSubjectVersionIds.length > 0
      ? await prisma.subjectVersion.findMany({
          where: { id: { in: missingSubjectVersionIds }, deletedAt: null },
        })
      : []

  const allSubjectVersions = [...subjectVersions, ...extraSubjectVersions]
  const allSubjectIds = uniqueIds([
    ...subjectIds,
    ...extraSubjectVersions.map((sv) => sv.subjectId),
  ])
  const allSubjects =
    allSubjectIds.length === subjectIds.length
      ? subjects
      : await prisma.subject.findMany({ where: { id: { in: allSubjectIds }, deletedAt: null } })

  const lecturerIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.lecturerId),
    ...subjectClasses.map((sc) => sc.extraLecturerId),
    ...subjectClasses.map((sc) => sc.enterGradeLecturerId),
    ...fixedClasses.map((fc) => fc.lecturerManagementId),
    ...classSchedules.map((cs) => cs.lecturerId),
    ...classSchedules.map((cs) => cs.extraLecturerId),
  ])

  const roomIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.roomId),
    ...classSchedules.map((cs) => cs.roomId),
  ])

  const trainingLocationIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.trainingLocationId),
    ...students.map((s) => s.trainingLocationId),
  ])

  const curriculumVersionIds = uniqueIds([
    ...fixedClasses.map((fc) => fc.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionId),
    ...students.map((s) => s.curriculumVersionParallelId),
  ])

  const [lecturers, rooms, curriculumVersions] = await Promise.all([
    lecturerIds.length > 0
      ? prisma.lecturer.findMany({ where: { id: { in: lecturerIds }, deletedAt: null } })
      : Promise.resolve([]),
    roomIds.length > 0
      ? prisma.room.findMany({ where: { id: { in: roomIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumVersionIds.length > 0
      ? prisma.curriculumVersion.findMany({
          where: { id: { in: curriculumVersionIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  const buildingIds = uniqueIds(rooms.map((r) => r.buildingId))
  const curriculumIds = uniqueIds(curriculumVersions.map((cv) => cv.curriculumId))

  const [buildings, curriculums] = await Promise.all([
    buildingIds.length > 0
      ? prisma.building.findMany({ where: { id: { in: buildingIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumIds.length > 0
      ? prisma.curriculum.findMany({ where: { id: { in: curriculumIds }, deletedAt: null } })
      : Promise.resolve([]),
  ])

  const trainingMajorIds = uniqueIds(curriculums.map((c) => c.trainingMajorId))
  const allTrainingLocationIds = uniqueIds([
    ...trainingLocationIds,
    ...buildings.map((b) => b.trainingLocationId),
  ])

  const [trainingMajors, trainingLocations] = await Promise.all([
    trainingMajorIds.length > 0
      ? prisma.trainingMajor.findMany({
          where: { id: { in: trainingMajorIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    allTrainingLocationIds.length > 0
      ? prisma.trainingLocation.findMany({
          where: { id: { in: allTrainingLocationIds }, deletedAt: null },
        })
      : Promise.resolve([]),
  ])

  const userProfileIds = uniqueIds([
    ...lecturers.map((l) => l.userProfileId),
    ...students.map((s) => s.userProfileId),
  ])

  const [userProfiles, catalogs, examRecords] = await Promise.all([
    userProfileIds.length > 0
      ? prisma.userProfile.findMany({
          where: { id: { in: userProfileIds }, deletedAt: null },
        })
      : Promise.resolve([]),
    loadAllCatalogs(),
    (async () => {
      const examIds = uniqueIds([
        ...exams.map((e) => e.id),
        ...subjectClasses.map((sc) => sc.examId),
      ])
      return examIds.length > 0
        ? prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
        : []
    })(),
  ])

  const { creditLimit, semester: _semester, trainingCourses: _tc, ...sessionRecord } = session

  const data = {
    ...catalogs,
    ClassRegisterSession: [sessionRecord],
    ClassRegisterSessionCredit: creditLimit,
    _ClassRegisterSessionToTrainingCourse: sessionToTrainingCourse,
    UserProfile: userProfiles,
    Student: students,
    Lecturer: lecturers,
    TrainingObjectType: trainingObjectTypes,
    SchoolYear: [schoolYear],
    Semester: [semesterRecord],
    TrainingCourse: trainingCourses,
    Subject: allSubjects,
    SubjectVersion: allSubjectVersions,
    SubjectClass: subjectClassRecords,
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
    StudentSemesterResult: studentSemesterResultsResolved,
    Exam: examRecords,
    ClassSchedule: classSchedules,
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
  )

  return serializeForJson({
    version: EXPORT_TRAINING_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    filters: {
      classRegisterSessionId,
      semesterId,
      trainingCourseIds,
    },
    counts,
    data,
  }) as {
    version: string
    exportedAt: string
    filters: {
      classRegisterSessionId: string
      semesterId: string
      trainingCourseIds: string[]
    }
    counts: Record<string, number>
    data: typeof data
  }
}
