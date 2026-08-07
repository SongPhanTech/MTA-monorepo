import type { PrismaClient } from "@workspace/db"

export type RegistrationStatsParams = {
  classRegisterSessionId: string
  from: Date
  to: Date
  page?: number
  pageSize?: number
}

export type RegistrationStatsResult = {
  summary: {
    eligibleCount: number
    registeredCount: number
    notRegisteredCount: number
    failedCount: number
  }
  failures: {
    total: number
    page: number
    pageSize: number
    items: Array<{
      id: string
      occurredAt: string
      code: string | null
      message: string
      student: {
        id: string | null
        studentCode: string | null
        fullName: string | null
        fixedClassName: string | null
      }
      subjectClasses: Array<{
        id: string
        classCode: string
        subjectName: string
      }>
    }>
  }
  from: string
  to: string
}

export async function getRegistrationStats(
  prisma: PrismaClient,
  params: RegistrationStatsParams
): Promise<RegistrationStatsResult> {
  const { classRegisterSessionId, from, to } = params
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))

  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
    include: {
      trainingCourses: { where: { deletedAt: null }, select: { id: true } },
    },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học")
  }

  const trainingCourseIds = session.trainingCourses.map((tc) => tc.id)

  const eligibleStudents =
    trainingCourseIds.length > 0
      ? await prisma.student.findMany({
          where: {
            deletedAt: null,
            fixedClass: { trainingCourseId: { in: trainingCourseIds }, deletedAt: null },
          },
          select: { id: true },
        })
      : []
  const eligibleIds = eligibleStudents.map((s) => s.id)
  const eligibleCount = eligibleIds.length

  const registeredInRange = await prisma.classRegisterLogs.findMany({
    where: {
      deletedAt: null,
      classRegisterSessionId,
      createdAt: { gte: from, lte: to },
    },
    select: { studentId: true },
    distinct: ["studentId"],
  })
  const registeredCount = registeredInRange.length

  const registeredByEnd = await prisma.classRegisterLogs.findMany({
    where: {
      deletedAt: null,
      classRegisterSessionId,
      createdAt: { lte: to },
    },
    select: { studentId: true },
    distinct: ["studentId"],
  })
  const registeredByEndSet = new Set(registeredByEnd.map((r) => r.studentId))
  const notRegisteredCount = eligibleIds.filter((id) => !registeredByEndSet.has(id)).length

  const failedDistinct = await prisma.classRegisterAttempt.findMany({
    where: {
      deletedAt: null,
      classRegisterSessionId,
      status: "FAILED",
      occurredAt: { gte: from, lte: to },
      OR: [{ studentId: { not: null } }, { userProfileId: { not: "" } }],
    },
    select: { studentId: true, userProfileId: true },
  })
  const failedKeys = new Set(failedDistinct.map((f) => f.studentId || `u:${f.userProfileId}`))
  const failedCount = failedKeys.size

  const failureWhere = {
    deletedAt: null,
    classRegisterSessionId,
    status: "FAILED" as const,
    occurredAt: { gte: from, lte: to },
  }

  const [failuresTotal, failureRows] = await Promise.all([
    prisma.classRegisterAttempt.count({ where: failureWhere }),
    prisma.classRegisterAttempt.findMany({
      where: failureWhere,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: {
          select: {
            id: true,
            code: true,
            fixedClass: { select: { name: true } },
            userProfile: { select: { fullname: true, code: true } },
          },
        },
      },
    }),
  ])

  // Resolve students thiếu relation (chỉ có userProfileId)
  const missingProfileIds = failureRows.filter((r) => !r.student).map((r) => r.userProfileId)
  const profiles =
    missingProfileIds.length > 0
      ? await prisma.student.findMany({
          where: { userProfileId: { in: missingProfileIds }, deletedAt: null },
          select: {
            id: true,
            code: true,
            userProfileId: true,
            fixedClass: { select: { name: true } },
            userProfile: { select: { fullname: true, code: true } },
          },
        })
      : []
  const profileByUserId = new Map(profiles.map((p) => [p.userProfileId, p]))

  const allSubjectClassIds = [...new Set(failureRows.flatMap((r) => r.subjectClassIds))]
  const subjectClasses =
    allSubjectClassIds.length > 0
      ? await prisma.subjectClass.findMany({
          where: { id: { in: allSubjectClassIds } },
          select: {
            id: true,
            code: true,
            name: true,
            subject: { select: { name: true, subject: { select: { name: true } } } },
          },
        })
      : []
  const scMap = new Map(
    subjectClasses.map((sc) => [
      sc.id,
      {
        id: sc.id,
        classCode: sc.code,
        subjectName: sc.subject?.name || sc.subject?.subject?.name || sc.name,
      },
    ])
  )

  const items = failureRows.map((row) => {
    const student =
      row.student ||
      (row.userProfileId ? profileByUserId.get(row.userProfileId) : undefined) ||
      null
    return {
      id: row.id,
      occurredAt: row.occurredAt.toISOString(),
      code: row.errorCode,
      message: row.message,
      student: {
        id: student?.id ?? null,
        studentCode: student?.code ?? student?.userProfile?.code ?? null,
        fullName: student?.userProfile?.fullname ?? null,
        fixedClassName: student?.fixedClass?.name ?? null,
      },
      subjectClasses: row.subjectClassIds
        .map((id) => scMap.get(id))
        .filter((x): x is { id: string; classCode: string; subjectName: string } => Boolean(x)),
    }
  })

  return {
    summary: {
      eligibleCount,
      registeredCount,
      notRegisteredCount,
      failedCount,
    },
    failures: {
      total: failuresTotal,
      page,
      pageSize,
      items,
    },
    from: from.toISOString(),
    to: to.toISOString(),
  }
}
