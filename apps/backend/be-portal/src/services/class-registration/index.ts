/**
 * Luồng ghi danh lớp học phần với concurrency control — 2 phương án so sánh:
 *
 * | Tiêu chí            | Optimistic (version + retry) | Pessimistic (FOR UPDATE)      |
 * |---------------------|------------------------------|-------------------------------|
 * | Cơ chế              | UPDATE điều kiện version     | Row lock, xếp hàng chờ        |
 * | Oversell            | Không (WHERE chặn sĩ số)     | Không (đọc dưới lock)         |
 * | Tranh chấp thấp     | Nhanh hơn (không chờ lock)   | Tương đương                   |
 * | Tranh chấp cao      | Nhiều rollback+retry         | Hàng đợi FIFO, ổn định        |
 * | Lỗi trả về khi nghẽn| 409 sau 3 retry              | 503 khi lock_timeout          |
 *
 * Chọn phương án qua env CLASS_REGISTER_LOCK_STRATEGY=optimistic|pessimistic
 * (mặc định: pessimistic — phù hợp thundering herd ~600 SV tranh lớp hot).
 */
import type { PrismaClient } from "@workspace/db"
import { registerWithOptimisticLock } from "./optimistic"
import { registerWithPessimisticLock } from "./pessimistic"
import type { RegisterParams } from "./shared"

export { toRegistrationError, RegistrationError } from "./errors"
export { assertNoScheduleConflict } from "./schedule-conflict"
export type { RegisterParams, RegisterClassInfo } from "./shared"

export type LockStrategy = "optimistic" | "pessimistic"

export function getLockStrategy(): LockStrategy {
  return process.env.CLASS_REGISTER_LOCK_STRATEGY === "optimistic" ? "optimistic" : "pessimistic"
}

export async function registerClasses(prisma: PrismaClient, params: RegisterParams): Promise<void> {
  const strategy = getLockStrategy()
  if (strategy === "optimistic") {
    await registerWithOptimisticLock(prisma, params)
  } else {
    await registerWithPessimisticLock(prisma, params)
  }
}
