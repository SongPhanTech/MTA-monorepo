/**
 * Helper: phát Kafka event lỗi đăng ký; nếu Kafka tắt/fail → ghi thẳng DB.
 */
import type { PrismaClient } from "@workspace/db"
import { publishRegistrationEvent } from "./kafka-queue"
import { persistFailedAttempt, type RegistrationFailedEvent } from "./persist-attempt"

export async function recordRegistrationFailure(
  prisma: PrismaClient,
  params: {
    jobId?: string
    userId: string
    sessionId: string
    subjectClassIds: string[]
    code?: string
    message: string
    attempts?: number
    occurredAt?: string
  }
): Promise<void> {
  const event: RegistrationFailedEvent = {
    type: "registration_failed",
    jobId: params.jobId,
    userId: params.userId,
    sessionId: params.sessionId,
    subjectClassIds: params.subjectClassIds,
    code: params.code,
    message: params.message,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
    attempts: params.attempts ?? 0,
  }

  const published = await publishRegistrationEvent(event)
  if (!published) {
    await persistFailedAttempt(prisma, event)
  }
}
