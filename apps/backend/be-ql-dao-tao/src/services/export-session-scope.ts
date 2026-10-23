import { prisma } from ".."

type JoinRow = { A: string; B: string }

const notDeleted = { deletedAt: null } as const

function uniqueIds(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))]
}

async function queryJoinTable(table: string): Promise<JoinRow[]> {
  try {
    return await prisma.$queryRawUnsafe<JoinRow[]>(`SELECT "A", "B" FROM "ql-dao-tao"."${table}"`)
  } catch {
    return []
  }
}

export type SessionScopeTarget = {
  id: string
  semesterId: string
  trainingCourses: Array<{ id: string } & Record<string, unknown>>
  creditLimit: unknown[]
}

/**
 * Phạm vi xuất theo đợt: chỉ SV / lớp niên chế thuộc khóa gắn đợt,
 * và LHP/TKB/điểm liên quan tới các SV đó — không kéo SV khóa khác qua LHP cả học kỳ.
 */
export async function loadSessionScopedEntities(targetSession: SessionScopeTarget) {
  const targetCourseIds = uniqueIds(targetSession.trainingCourses.map((tc) => tc.id))
  const targetSemesterId = targetSession.semesterId

  if (targetCourseIds.length === 0) {
    return {
      targetCourseIds,
      targetSemesterId,
      trainingCourses: [] as SessionScopeTarget["trainingCourses"],
      trainingCourseRegulations: [] as Awaited<
        ReturnType<typeof prisma.trainingCourseRegulation.findMany>
      >,
      fixedClasses: [] as Awaited<ReturnType<typeof prisma.fixedClass.findMany>>,
      students: [] as Awaited<ReturnType<typeof prisma.student.findMany>>,
      subjectClasses: [] as Awaited<ReturnType<typeof prisma.subjectClass.findMany>>,
      subjectClassTimes: [] as Awaited<ReturnType<typeof prisma.subjectClassTime.findMany>>,
      classSchedules: [] as Awaited<ReturnType<typeof prisma.classSchedule.findMany>>,
      exams: [] as Awaited<ReturnType<typeof prisma.exam.findMany>>,
      fixedClassToSubjectClass: [] as JoinRow[],
      lecturers: [] as Awaited<ReturnType<typeof prisma.lecturer.findMany>>,
      staff: [] as Awaited<ReturnType<typeof prisma.staff.findMany>>,
      userProfiles: [] as Awaited<ReturnType<typeof prisma.userProfile.findMany>>,
      studentSubjectScores: [] as Awaited<ReturnType<typeof prisma.studentSubjectScore.findMany>>,
      studentSemesterResults: [] as Awaited<
        ReturnType<typeof prisma.studentSemesterResult.findMany>
      >,
      studentIds: [] as string[],
    }
  }

  const [trainingCourseRegulations, fixedClasses, allFixedClassToSubjectClass] = await Promise.all([
    prisma.trainingCourseRegulation.findMany({
      where: { trainingCourseId: { in: targetCourseIds }, deletedAt: null },
    }),
    prisma.fixedClass.findMany({
      where: { trainingCourseId: { in: targetCourseIds }, deletedAt: null },
    }),
    queryJoinTable("_FixedClassToSubjectClass"),
  ])

  const fixedClassIds = fixedClasses.map((fc) => fc.id)
  const fixedClassIdSet = new Set(fixedClassIds)

  const students =
    fixedClassIds.length > 0
      ? await prisma.student.findMany({
          where: {
            deletedAt: null,
            OR: [
              { fixedClassId: { in: fixedClassIds } },
              { fixedClass: { trainingCourseId: { in: targetCourseIds } } },
            ],
          },
        })
      : await prisma.student.findMany({
          where: {
            deletedAt: null,
            fixedClass: { trainingCourseId: { in: targetCourseIds } },
          },
        })

  const studentIds = uniqueIds(students.map((s) => s.id))

  // LHP: chỉ các lớp gắn lớp niên chế của khóa + thuộc học kỳ đợt
  const courseJoins = allFixedClassToSubjectClass.filter((r) => fixedClassIdSet.has(r.A))
  const candidateSubjectClassIds = uniqueIds(courseJoins.map((r) => r.B))

  const subjectClasses =
    candidateSubjectClassIds.length > 0
      ? await prisma.subjectClass.findMany({
          where: {
            id: { in: candidateSubjectClassIds },
            semesterId: targetSemesterId,
            deletedAt: null,
          },
        })
      : []

  const subjectClassIds = subjectClasses.map((sc) => sc.id)
  const subjectClassIdSet = new Set(subjectClassIds)
  const fixedClassToSubjectClass = courseJoins.filter((r) => subjectClassIdSet.has(r.B))

  const examIds = uniqueIds(subjectClasses.map((sc) => sc.examId))
  const lecturerIds = uniqueIds([
    ...subjectClasses.map((sc) => sc.lecturerId),
    ...subjectClasses.map((sc) => sc.extraLecturerId),
    ...subjectClasses.map((sc) => sc.enterGradeLecturerId),
    ...fixedClasses.map((fc) => fc.lecturerManagementId),
  ])
  const staffIds = uniqueIds(fixedClasses.map((fc) => fc.staffManagementId))

  const [subjectClassTimes, classSchedules, exams, lecturers, staff, studentSubjectScores, studentSemesterResults] =
    await Promise.all([
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
      examIds.length > 0
        ? prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
        : Promise.resolve([]),
      lecturerIds.length > 0
        ? prisma.lecturer.findMany({ where: { id: { in: lecturerIds }, deletedAt: null } })
        : Promise.resolve([]),
      staffIds.length > 0
        ? prisma.staff.findMany({ where: { id: { in: staffIds }, deletedAt: null } })
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

  return {
    targetCourseIds,
    targetSemesterId,
    trainingCourses: targetSession.trainingCourses,
    trainingCourseRegulations,
    fixedClasses,
    students,
    subjectClasses,
    subjectClassTimes,
    classSchedules,
    exams,
    fixedClassToSubjectClass,
    lecturers,
    staff,
    userProfiles,
    studentSubjectScores,
    studentSemesterResults,
    studentIds,
  }
}

export { notDeleted, uniqueIds, queryJoinTable }
