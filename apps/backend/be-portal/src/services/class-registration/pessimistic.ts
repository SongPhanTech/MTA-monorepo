/**
 * PHƯƠNG ÁN 2 — PESSIMISTIC LOCKING (khóa bi quan, SELECT ... FOR UPDATE)
 *
 * Ý tưởng: khóa row SubjectClass ngay đầu transaction. Mọi request khác đăng ký
 * cùng lớp phải XẾP HÀNG chờ lock, nên đọc sĩ số → kiểm tra → ghi danh là chuỗi
 * tuần tự tuyệt đối, không thể oversell.
 *
 * Chống deadlock/treo lock:
 * - Khóa các lớp theo thứ tự id tăng dần (ORDER BY id) — hai request đăng ký
 *   nhiều lớp giao nhau luôn khóa cùng thứ tự, không thể deadlock chéo.
 * - SET LOCAL lock_timeout: chờ lock quá hạn → PostgreSQL báo 55P03, API trả 503
 *   để client retry, thay vì giữ connection treo làm cạn pool.
 * - maxWait/timeout của Prisma transaction chặn transaction chạy quá lâu.
 *
 * Sĩ số kiểm tra bằng COUNT trực tiếp trên StudentSubjectScore (nguồn dữ liệu chuẩn),
 * đồng thời cập nhật enrolledCount/version để đồng bộ với phương án optimistic.
 *
 * Ưu điểm: công bằng (FIFO theo hàng đợi lock), không lãng phí retry khi tranh chấp cao.
 * Nhược điểm: lock serialize mọi đăng ký vào cùng lớp — lớp hot thành hàng đợi;
 * nếu transaction chậm (query nặng trong lúc giữ lock) sẽ dồn ứ connection.
 */
import { Prisma, type PrismaClient } from "@workspace/db"
import { ClassFullError } from "./errors"
import { assertNotAlreadyRegistered, insertRegistrations, type RegisterParams } from "./shared"

const LOCK_TIMEOUT_MS = Number(process.env.CLASS_REGISTER_LOCK_TIMEOUT_MS || 4_000)

export async function registerWithPessimisticLock(
  prisma: PrismaClient,
  params: RegisterParams
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // Chờ lock tối đa LOCK_TIMEOUT_MS rồi bỏ cuộc (55P03) — tránh treo connection
      await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT_MS}ms'`)

      // Row lock theo thứ tự id — giữ lock đến hết transaction
      await tx.$queryRaw`
        SELECT id FROM "ql-dao-tao"."SubjectClass"
        WHERE id IN (${Prisma.join(params.classIds)})
        ORDER BY id
        FOR UPDATE
      `

      await assertNotAlreadyRegistered(tx, params)

      // Đếm sĩ số thật từ bản ghi ghi danh — dưới lock nên không thể race
      const enrolledRows = await tx.studentSubjectScore.groupBy({
        by: ["subjectClassId"],
        where: { subjectClassId: { in: params.classIds } },
        _count: { _all: true },
      })
      const enrolledMap = new Map(
        enrolledRows.map((row) => [row.subjectClassId as string, row._count._all])
      )

      for (const classId of params.classIds) {
        const info = params.classLookup.get(classId)!
        const currentEnrolled = enrolledMap.get(classId) || 0
        if (info.maxStudent <= currentEnrolled) {
          throw new ClassFullError(info.subjectName)
        }
      }

      await insertRegistrations(tx, params)

      // Đồng bộ counter/version để nhất quán với phương án optimistic
      await tx.subjectClass.updateMany({
        where: { id: { in: params.classIds } },
        data: {
          enrolledCount: { increment: 1 },
          version: { increment: 1 },
        },
      })
    },
    {
      // Giữ lock ngắn: chỉ lock + 2 query kiểm tra + 3 write batch trong transaction
      maxWait: 5_000,
      timeout: 10_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  )
}
