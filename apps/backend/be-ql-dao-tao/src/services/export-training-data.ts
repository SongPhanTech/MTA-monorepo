import type { Prisma } from "@workspace/db"
import { Prisma as PrismaNamespace } from "@workspace/db"
import { prisma } from ".."

export const EXPORT_TRAINING_DATA_VERSION = "1.1.0"

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
    students,
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
    fixedClassIds.length > 0
      ? prisma.student.findMany({
          where: {
            deletedAt: null,
            fixedClassId: { in: fixedClassIds },
          },
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

  const studentIds = uniqueIds(students.map((s) => s.id))
  const subjectIds = uniqueIds(subjectVersions.map((sv) => sv.subjectId))

  const [subjects, subjectClassRecords, studentSubjectScores, studentSemesterResults, exams] =
    await Promise.all([
      subjectIds.length > 0
        ? prisma.subject.findMany({ where: { id: { in: subjectIds }, deletedAt: null } })
        : Promise.resolve([]),
      subjectClassIds.length > 0
        ? prisma.subjectClass.findMany({ where: { id: { in: subjectClassIds } } })
        : Promise.resolve([]),
      studentIds.length > 0
        ? prisma.studentSubjectScore.findMany({
            where: { studentId: { in: studentIds }, deletedAt: null },
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? prisma.studentSemesterResult.findMany({
            where: { studentId: { in: studentIds }, deletedAt: null },
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
  const lecturerTypeIds = uniqueIds(lecturers.map((l) => l.lecturerTypeId))

  const [buildings, curriculums, lecturerTypes] = await Promise.all([
    buildingIds.length > 0
      ? prisma.building.findMany({ where: { id: { in: buildingIds }, deletedAt: null } })
      : Promise.resolve([]),
    curriculumIds.length > 0
      ? prisma.curriculum.findMany({ where: { id: { in: curriculumIds }, deletedAt: null } })
      : Promise.resolve([]),
    lecturerTypeIds.length > 0
      ? prisma.lecturerType.findMany({ where: { id: { in: lecturerTypeIds }, deletedAt: null } })
      : Promise.resolve([]),
  ])

  const trainingMajorIds = uniqueIds(curriculums.map((c) => c.trainingMajorId))
  const allTrainingLocationIds = uniqueIds([
    ...trainingLocationIds,
    ...buildings.map((b) => b.trainingLocationId),
  ])

  const organizationIds = uniqueIds([
    ...allSubjects.map((s) => s.managementOrganizationId),
    ...allSubjectVersions.map((sv) => sv.managementOrganizationId),
    ...fixedClasses.map((fc) => fc.managementOrganizationId),
    ...lecturers.map((l) => l.organizationId),
    ...curriculums.map((c) => c.managementOrganizationId),
  ])

  const [trainingMajors, trainingLocations, dmDonVis] = await Promise.all([
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
    organizationIds.length > 0
      ? prisma.dM_DonVi.findMany({ where: { Id: { in: organizationIds } } })
      : Promise.resolve([]),
  ])

  const dmDonViIdsFromMajors = uniqueIds([
    ...trainingMajors.map((tm) => tm.organizationId),
    ...trainingMajors.map((tm) => tm.secondOrganizationId),
    ...trainingMajors.map((tm) => tm.thirdOrganizationId),
  ])

  const extraDmDonVis =
    dmDonViIdsFromMajors.length > 0
      ? await prisma.dM_DonVi.findMany({ where: { Id: { in: dmDonViIdsFromMajors } } })
      : []

  const allDmDonVis = [
    ...dmDonVis,
    ...extraDmDonVis.filter((d) => !dmDonVis.some((existing) => existing.Id === d.Id)),
  ]

  const userProfileIds = uniqueIds([
    ...lecturers.map((l) => l.userProfileId),
    ...students.map((s) => s.userProfileId),
  ])

  const userProfiles =
    userProfileIds.length > 0
      ? await prisma.userProfile.findMany({ where: { id: { in: userProfileIds } } })
      : []

  const examIds = uniqueIds([
    ...exams.map((e) => e.id),
    ...subjectClasses.map((sc) => sc.examId),
  ])
  const examRecords =
    examIds.length > 0
      ? await prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
      : []

  const { creditLimit, semester: _semester, trainingCourses: _tc, ...sessionRecord } = session

  const data = {
    ClassRegisterSession: [sessionRecord],
    ClassRegisterSessionCredit: creditLimit,
    _ClassRegisterSessionToTrainingCourse: sessionToTrainingCourse,
    DM_DonVi: allDmDonVis,
    UserProfile: userProfiles,
    LecturerType: lecturerTypes,
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
    Student: students,
    StudentSubjectScore: studentSubjectScores,
    StudentSemesterResult: studentSemesterResults,
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
