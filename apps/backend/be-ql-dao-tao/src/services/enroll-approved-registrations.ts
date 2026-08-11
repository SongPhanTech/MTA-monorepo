import { ClassRegisterStatus } from "@workspace/db"
import { prisma } from ".."

const BATCH = 500

export type EnrollApprovedRegistrationsResult = {
  message: string
  created: number
  alreadyEnrolled: number
  skippedMissingFk: number
  byClass: Array<{ subjectClassId: string; created: number }>
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Đưa SV có đơn ClassRegisterLogs.status = SUCCESS vào lớp môn học
 * bằng cách tạo StudentSubjectScore còn thiếu + đồng bộ enrolledCount.
 */
export async function enrollApprovedRegistrations(
  classRegisterSessionId: string
): Promise<EnrollApprovedRegistrationsResult> {
  const session = await prisma.classRegisterSession.findFirst({
    where: { id: classRegisterSessionId, deletedAt: null },
    select: { id: true, semesterId: true, name: true },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt đăng ký học")
  }

  type MissingRow = {
    studentId: string
    subjectClassId: string
    subjectVersionId: string
  }

  const missing = await prisma.$queryRaw<MissingRow[]>`
    SELECT
      l."studentId",
      l."subjectClassId",
      sc."subjectId" AS "subjectVersionId"
    FROM "ql-dao-tao"."ClassRegisterLogs" l
    INNER JOIN "ql-dao-tao"."SubjectClass" sc
      ON sc.id = l."subjectClassId"
      AND sc."deletedAt" IS NULL
    INNER JOIN "ql-dao-tao"."Student" st
      ON st.id = l."studentId"
      AND st."deletedAt" IS NULL
    INNER JOIN "ql-dao-tao"."SubjectVersion" sv
      ON sv.id = sc."subjectId"
      AND sv."deletedAt" IS NULL
    LEFT JOIN "ql-dao-tao"."StudentSubjectScore" sss
      ON sss."studentId" = l."studentId"
      AND sss."subjectClassId" = l."subjectClassId"
      AND sss."deletedAt" IS NULL
    WHERE l."classRegisterSessionId" = ${classRegisterSessionId}
      AND l."deletedAt" IS NULL
      AND l.active = true
      AND l.status::text = 'SUCCESS'
      AND sss.id IS NULL
    ORDER BY l."createdAt" ASC
  `

  const successCount = await prisma.classRegisterLogs.count({
    where: {
      classRegisterSessionId,
      deletedAt: null,
      active: true,
      status: ClassRegisterStatus.SUCCESS,
    },
  })

  const seen = new Set<string>()
  const toCreate: MissingRow[] = []
  let skippedMissingFk = 0
  for (const row of missing) {
    if (!row.studentId || !row.subjectClassId || !row.subjectVersionId) {
      skippedMissingFk += 1
      continue
    }
    const key = `${row.studentId}::${row.subjectClassId}`
    if (seen.has(key)) continue
    seen.add(key)
    toCreate.push(row)
  }

  const alreadyEnrolled = Math.max(0, successCount - toCreate.length)

  if (toCreate.length === 0) {
    return {
      message:
        alreadyEnrolled > 0
          ? `Không có SV mới cần đưa vào lớp. Đã có sẵn ${alreadyEnrolled} SV trong lớp.`
          : "Không có đơn đăng ký ở trạng thái Được chấp thuận cần xử lý.",
      created: 0,
      alreadyEnrolled,
      skippedMissingFk,
      byClass: [],
    }
  }

  let created = 0
  const plannedByClass = new Map<string, number>()
  for (const r of toCreate) {
    plannedByClass.set(r.subjectClassId, (plannedByClass.get(r.subjectClassId) || 0) + 1)
  }

  await prisma.$transaction(async (tx) => {
    for (const batch of chunk(toCreate, BATCH)) {
      const result = await tx.studentSubjectScore.createMany({
        data: batch.map((r) => ({
          studentId: r.studentId,
          subjectClassId: r.subjectClassId,
          subjectVersionId: r.subjectVersionId,
          semesterId: session.semesterId,
        })),
        skipDuplicates: true,
      })
      created += result.count
    }

    // Đồng bộ enrolledCount theo số SSS thực tế của các lớp vừa đụng tới
    for (const subjectClassId of plannedByClass.keys()) {
      const actual = await tx.studentSubjectScore.count({
        where: { subjectClassId, deletedAt: null },
      })
      await tx.subjectClass.update({
        where: { id: subjectClassId },
        data: {
          enrolledCount: actual,
          version: { increment: 1 },
        },
      })
    }
  })

  const byClass = [...plannedByClass.entries()].map(([subjectClassId, count]) => ({
    subjectClassId,
    created: count,
  }))

  return {
    message: `Đã đưa ${created} SV vào lớp môn học${
      alreadyEnrolled > 0 ? ` (${alreadyEnrolled} đã có sẵn)` : ""
    }.`,
    created,
    alreadyEnrolled,
    skippedMissingFk,
    byClass,
  }
}
