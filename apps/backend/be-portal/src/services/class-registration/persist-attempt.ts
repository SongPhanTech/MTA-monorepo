/**
 * Ghi ClassRegisterAttempt (lỗi đăng ký) — dùng khi Kafka events tắt
 * hoặc consumer chưa kịp ghi / produce fail.
 */
import type { PrismaClient } from "@workspace/db"

export type RegistrationFailedEvent = {
  type: "registration_failed"
  jobId?: string
  userId: string
  sessionId: string
  subjectClassIds: string[]
  code?: string
  message: string
  occurredAt: string
  attempts: number
}

export async function persistFailedAttempt(
  prisma: PrismaClient,
  event: RegistrationFailedEvent
): Promise<void> {
  const student = await prisma.student.findFirst({
    where: { userProfileId: event.userId, deletedAt: null },
    select: { id: true },
  })

  const data = {
    classRegisterSessionId: event.sessionId,
    studentId: student?.id ?? null,
    userProfileId: event.userId,
    jobId: event.jobId ?? null,
    status: "FAILED" as const,
    errorCode: event.code ?? null,
    message: event.message,
    subjectClassIds: event.subjectClassIds,
    occurredAt: new Date(event.occurredAt),
    attempts: event.attempts,
  }

  try {
    if (event.jobId) {
      await prisma.classRegisterAttempt.upsert({
        where: { jobId: event.jobId },
        create: data,
        update: {
          studentId: data.studentId,
          errorCode: data.errorCode,
          message: data.message,
          subjectClassIds: data.subjectClassIds,
          occurredAt: data.occurredAt,
          attempts: data.attempts,
        },
      })
      return
    }
    await prisma.classRegisterAttempt.create({ data })
  } catch (e) {
    console.warn("[class-register-attempt] persist failed", e)
  }
}
