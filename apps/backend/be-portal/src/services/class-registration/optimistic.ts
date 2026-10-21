/**
 * PHƯƠNG ÁN 1 — OPTIMISTIC LOCKING (khóa lạc quan)
 *
 * Ý tưởng: không khóa row. Đọc (version, enrolledCount) của lớp, rồi UPDATE có điều kiện:
 *
 *   UPDATE SubjectClass
 *   SET enrolledCount = enrolledCount + 1, version = version + 1
 *   WHERE id = ? AND version = <version đã đọc> AND enrolledCount < maxStudent
 *
 * - 2 sinh viên cùng đọc version=5: người UPDATE trước thắng (version thành 6),
 *   người sau UPDATE 0 row (version mismatch) → rollback transaction → retry (tối đa 3 lần).
 * - Điều kiện `enrolledCount < maxStudent` nằm ngay trong WHERE nên KHÔNG THỂ oversell,
 *   kể cả khi hai request đan xen nhau.
 * - Unique constraint [subjectClassId, studentId] trên StudentSubjectScore là lưới an toàn
 *   cuối chống đăng ký trùng (P2002).
 *
 * Ưu điểm: không giữ lock → throughput cao khi tranh chấp thấp/vừa.
 * Nhược điểm: khi 600 SV cùng tranh 1 lớp hot, tỉ lệ retry cao → tốn công CPU/DB cho
 * các transaction bị rollback; sinh viên chậm tay nhận 409 sau 3 lần thử.
 */
import { Prisma, type PrismaClient } from "@workspace/db"
import { ClassFullError, VersionConflictError } from "./errors"
import { assertNotAlreadyRegistered, insertRegistrations, type RegisterParams } from "./shared"

const MAX_RETRIES = 3

/** Signal nội bộ: version mismatch → rollback + retry cả transaction. */
class OptimisticConflictSignal extends Error {
  constructor(readonly subjectClassId: string) {
    super(`optimistic conflict on ${subjectClassId}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Backoff có jitter: 50–100ms, 100–200ms, 200–400ms — tránh các retry lại đụng nhau. */
function backoffMs(attempt: number): number {
  const base = 50 * 2 ** (attempt - 1)
  return base + Math.floor(Math.random() * base)
}

async function attemptRegister(prisma: PrismaClient, params: RegisterParams): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await assertNotAlreadyRegistered(tx, params)

      // Đọc trạng thái hiện tại (KHÔNG khóa row)
      const classes = await tx.subjectClass.findMany({
        where: { id: { in: params.classIds } },
        select: { id: true, version: true, enrolledCount: true, maxStudent: true },
      })
      const classMap = new Map(classes.map((cls) => [cls.id, cls]))

      for (const classId of params.classIds) {
        const cls = classMap.get(classId)
        const info = params.classLookup.get(classId)!

        // Hết chỗ ngay từ lúc đọc → lỗi nghiệp vụ, không retry
        if (!cls || (cls.maxStudent > 0 && cls.enrolledCount >= cls.maxStudent)) {
          throw new ClassFullError(info.subjectName)
        }

        // UPDATE có điều kiện version + sĩ số — trái tim của optimistic locking
        const updated = await tx.subjectClass.updateMany({
          where: {
            id: classId,
            version: cls.version,
            enrolledCount: { lt: cls.maxStudent },
          },
          data: {
            enrolledCount: { increment: 1 },
            version: { increment: 1 },
          },
        })

        // 0 row = có người vừa cập nhật trước (version mismatch) HOẶC lớp vừa đầy.
        // Rollback toàn bộ rồi retry: lần đọc sau sẽ phân biệt được 2 trường hợp.
        if (updated.count === 0) {
          throw new OptimisticConflictSignal(classId)
        }
      }

      await insertRegistrations(tx, params)
    },
    {
      maxWait: 5_000,
      timeout: 10_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  )
}

export async function registerWithOptimisticLock(
  prisma: PrismaClient,
  params: RegisterParams
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await attemptRegister(prisma, params)
      return
    } catch (err) {
      if (err instanceof OptimisticConflictSignal) {
        if (attempt >= MAX_RETRIES) {
          console.warn(
            `[class-register][optimistic] student=${params.studentId} class=${err.subjectClassId} hết ${MAX_RETRIES} lần retry`
          )
          throw new VersionConflictError()
        }
        await sleep(backoffMs(attempt))
        continue
      }
      throw err
    }
  }
}
