import { ApplicationStatus, Prisma, StudentStatus } from "@workspace/db"
import { prisma } from ".."

type DbClient = Prisma.TransactionClient | typeof prisma

/** Sinh viên còn được xét TN: đang học, hoặc đã TN nhưng chỉ thuộc đợt đã xóa. */
export function eligibleStudentForGraduationWhere(
  extra: Prisma.StudentWhereInput = {}
): Prisma.StudentWhereInput {
  return {
    deletedAt: null,
    ...extra,
    OR: [
      {
        status: {
          in: [StudentStatus.ENROLLED, StudentStatus.PENDING_GRADUATION_REVIEW],
        },
      },
      {
        status: StudentStatus.GRADUATED,
        graduationApplications: {
          none: {
            deletedAt: null,
            status: ApplicationStatus.APPROVED,
            session: { deletedAt: null },
          },
        },
      },
    ],
  }
}

async function detachDiplomaFiles(tx: DbClient, decisionIds: string[]) {
  if (decisionIds.length === 0) return

  await tx.documentFile.updateMany({
    where: { diplomaFrontId: { in: decisionIds } },
    data: { diplomaFrontId: null },
  })
  await tx.documentFile.updateMany({
    where: { diplomaBackId: { in: decisionIds } },
    data: { diplomaBackId: null },
  })
}

async function studentsToKeepGraduated(studentIds: string[], excludeSessionId?: string) {
  if (studentIds.length === 0) return new Set<string>()

  const rows = await prisma.studentGraduationApplication.findMany({
    where: {
      studentId: { in: studentIds },
      ...(excludeSessionId ? { sessionId: { not: excludeSessionId } } : {}),
      status: ApplicationStatus.APPROVED,
      deletedAt: null,
      session: { deletedAt: null },
    },
    select: { studentId: true },
  })
  return new Set(rows.map((row) => row.studentId))
}

async function cleanupApplications(
  tx: DbClient,
  applicationIds: string[],
  studentIdsToReset: string[],
  now = new Date()
) {
  if (applicationIds.length > 0) {
    const decisions = await tx.graduationDecision.findMany({
      where: { applicationId: { in: applicationIds } },
      select: { id: true },
    })
    const decisionIds = decisions.map((row) => row.id)

    await detachDiplomaFiles(tx, decisionIds)
    if (decisionIds.length > 0) {
      await tx.graduationDecision.deleteMany({ where: { id: { in: decisionIds } } })
    }

    await tx.applicationCheckResult.updateMany({
      where: { studentGraduationApplicationId: { in: applicationIds }, deletedAt: null },
      data: { deletedAt: now },
    })
    await tx.applicationDowngraded.updateMany({
      where: { studentGraduationApplicationId: { in: applicationIds }, deletedAt: null },
      data: { deletedAt: now },
    })
    await tx.studentGraduationApplication.updateMany({
      where: { id: { in: applicationIds }, deletedAt: null },
      data: { deletedAt: now },
    })
  }

  if (studentIdsToReset.length > 0) {
    await tx.student.updateMany({
      where: {
        id: { in: studentIdsToReset },
        status: { in: [StudentStatus.GRADUATED, StudentStatus.PENDING_GRADUATION_REVIEW] },
      },
      data: { status: StudentStatus.ENROLLED },
    })
  }
}

/** Xóa cứng quyết định TN leftover (đợt đã xóa) và trả HV về đang học. */
export async function reclaimStudentsFromStaleGraduation(tx: DbClient, studentIds: string[]) {
  if (studentIds.length === 0) return

  const staleDecisions = await tx.graduationDecision.findMany({
    where: {
      studentId: { in: studentIds },
      OR: [
        { deletedAt: { not: null } },
        { application: { session: { deletedAt: { not: null } } } },
      ],
    },
    select: { id: true },
  })
  const decisionIds = staleDecisions.map((row) => row.id)

  await detachDiplomaFiles(tx, decisionIds)
  if (decisionIds.length > 0) {
    await tx.graduationDecision.deleteMany({ where: { id: { in: decisionIds } } })
  }

  await tx.student.updateMany({
    where: {
      id: { in: studentIds },
      status: { in: [StudentStatus.GRADUATED, StudentStatus.PENDING_GRADUATION_REVIEW] },
    },
    data: { status: StudentStatus.ENROLLED },
  })
}

/**
 * Dọn dữ liệu leftover của các đợt xét đã xóa trước đó
 * (học viên vẫn GRADUATED, quyết định TN còn chiếm unique).
 */
export async function reclaimAllStaleGraduationData() {
  const staleApplications = await prisma.studentGraduationApplication.findMany({
    where: {
      session: { deletedAt: { not: null } },
    },
    select: {
      id: true,
      studentId: true,
    },
  })

  const staleDecisions = await prisma.graduationDecision.findMany({
    where: {
      application: { session: { deletedAt: { not: null } } },
    },
    select: { id: true, studentId: true, applicationId: true },
  })

  const applicationIds = [
    ...new Set([
      ...staleApplications.map((row) => row.id),
      ...staleDecisions.map((row) => row.applicationId),
    ]),
  ]
  const candidateStudentIds = [
    ...new Set([
      ...staleApplications.map((row) => row.studentId),
      ...staleDecisions.map((row) => row.studentId),
    ]),
  ]

  if (applicationIds.length === 0 && candidateStudentIds.length === 0) {
    return { studentCount: 0, applicationCount: 0 }
  }

  const keepGraduated = await studentsToKeepGraduated(candidateStudentIds)
  const studentIdsToReset = candidateStudentIds.filter((studentId) => !keepGraduated.has(studentId))

  await prisma.$transaction(
    async (tx) => {
      await cleanupApplications(tx, applicationIds, studentIdsToReset)
    },
    { timeout: 60_000 }
  )

  return {
    studentCount: studentIdsToReset.length,
    applicationCount: applicationIds.length,
  }
}

/**
 * Xóa đợt xét TN: gỡ quyết định/đơn liên quan và trả trạng thái HV
 * để có thể tạo đợt mới cho cùng khoá.
 */
export async function deleteGraduationSessionCascade(sessionId: string) {
  const session = await prisma.graduationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, deletedAt: true },
  })

  if (!session) {
    throw new Error("Đợt xét tốt nghiệp không tồn tại")
  }

  const applications = await prisma.studentGraduationApplication.findMany({
    where: { sessionId },
    select: {
      id: true,
      studentId: true,
      student: { select: { id: true, status: true } },
    },
  })
  const applicationIds = applications.map((row) => row.id)
  const candidateStudentIds = [...new Set(applications.map((row) => row.studentId))]
  const keepGraduated = await studentsToKeepGraduated(candidateStudentIds, sessionId)

  const studentIdsToReset = candidateStudentIds.filter((studentId) => {
    if (keepGraduated.has(studentId)) return false
    const student = applications.find((row) => row.studentId === studentId)?.student
    return (
      student?.status === StudentStatus.GRADUATED ||
      student?.status === StudentStatus.PENDING_GRADUATION_REVIEW
    )
  })

  const now = new Date()

  await prisma.$transaction(
    async (tx) => {
      await cleanupApplications(tx, applicationIds, studentIdsToReset, now)

      if (!session.deletedAt) {
        await tx.graduationSession.update({
          where: { id: sessionId },
          data: { deletedAt: now },
        })
      }
    },
    { timeout: 60_000 }
  )

  return { id: session.id, name: session.name }
}
