/**
 * Lỗi nghiệp vụ của luồng đăng ký học — mỗi lỗi mang sẵn HTTP status
 * để endpoint map thẳng ra response, không lẫn với lỗi hệ thống.
 */
import { Prisma } from "@workspace/db"

export type RegistrationErrorStatus = 400 | 404 | 409 | 503

export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly status: RegistrationErrorStatus,
    readonly code: string
  ) {
    super(message)
    this.name = new.target.name
  }
}

/** Lớp đã đủ sĩ số. */
export class ClassFullError extends RegistrationError {
  constructor(subjectName: string) {
    super(`Lớp ${subjectName} đã đủ số lượng sinh viên`, 400, "CLASS_FULL")
  }
}

/** Sinh viên đã đăng ký học phần này (chống double-submit / trùng unique). */
export class AlreadyRegisteredError extends RegistrationError {
  constructor(subjectName?: string) {
    super(`Bạn đã đăng ký học phần ${subjectName ?? "này"}`, 409, "ALREADY_REGISTERED")
  }
}

/** Trùng lịch học (cùng thứ, tiết giao nhau) với lớp đã đăng ký hoặc trong cùng lượt đăng ký. */
export class ScheduleConflictError extends RegistrationError {
  constructor(subjectA: string, subjectB: string) {
    super(`Lớp ${subjectA} bị trùng lịch với lớp ${subjectB}`, 400, "SCHEDULE_CONFLICT")
  }
}

/** Optimistic locking: hết số lần retry mà version vẫn xung đột. */
export class VersionConflictError extends RegistrationError {
  constructor() {
    super(
      "Lớp học đang có nhiều sinh viên đăng ký cùng lúc. Vui lòng thử lại.",
      409,
      "VERSION_CONFLICT"
    )
  }
}

/** Deadlock / lock timeout / pool timeout — hệ thống đang nghẽn, client nên retry sau. */
export class LockTimeoutError extends RegistrationError {
  constructor() {
    super(
      "Hệ thống đang quá tải do nhiều sinh viên đăng ký cùng lúc. Vui lòng thử lại sau vài giây.",
      503,
      "LOCK_TIMEOUT"
    )
  }
}

/**
 * Dịch lỗi hạ tầng (Prisma/PostgreSQL) sang RegistrationError.
 * Trả về null nếu không nhận diện được (endpoint sẽ ném tiếp cho error handler chung).
 */
export function toRegistrationError(err: unknown): RegistrationError | null {
  if (err instanceof RegistrationError) return err

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: vi phạm unique [subjectClassId, studentId] — lưới an toàn cuối chống đăng ký trùng
    if (err.code === "P2002") return new AlreadyRegisteredError()
    // P2034: transaction fail vì write conflict / deadlock
    if (err.code === "P2034") return new LockTimeoutError()
    // P2024: hết pool_timeout mà không lấy được connection
    if (err.code === "P2024") return new LockTimeoutError()
    // P2028: transaction API timeout (maxWait/timeout)
    if (err.code === "P2028") return new LockTimeoutError()
  }

  const msg = err instanceof Error ? err.message : String(err)
  // 40P01: deadlock detected | 55P03: lock_timeout (SET LOCAL lock_timeout)
  if (/40P01|deadlock detected|55P03|lock timeout|lock_not_available/i.test(msg)) {
    return new LockTimeoutError()
  }
  if (/timed out|timeout|Unable to start a transaction/i.test(msg)) {
    return new LockTimeoutError()
  }

  return null
}
