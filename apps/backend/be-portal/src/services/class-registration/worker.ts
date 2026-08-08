/**
 * Background Worker (Consumer) — lắng nghe course_registration_queue và ghi danh vào DB.
 *
 * - Concurrency giới hạn (mặc định 5, tối đa 10) → DB không bao giờ nhận quá
 *   N transaction đăng ký cùng lúc, dù có 600 sinh viên bấm cùng thời điểm.
 * - Ghi danh dùng lại pipeline processRegistration (đã có DB Locking chống overselling).
 * - Thành công  → job status "success" (Redis).
 * - Lỗi nghiệp vụ (hết chỗ, trùng lịch, thiếu tiên quyết...) → "failed" kèm lý do.
 * - DB timeout/deadlock → NACK: đẩy message trở lại queue (attempts+1), tối đa
 *   CLASS_REGISTER_MAX_ATTEMPTS (3) lần; quá thì đẩy vào DLQ + "failed".
 */
import type { PrismaClient } from "@workspace/db"
import { LockTimeoutError, toRegistrationError } from "./errors"
import { setJobStatus } from "./job-store"
import {
  KAFKA_ENABLED,
  REGISTRATION_CONSUMER_GROUP,
  REGISTRATION_TOPIC,
  getKafka,
  requeueRegistration,
  sendToDeadLetterQueue,
  type RegistrationJobMessage,
} from "./kafka-queue"
import { processRegistration } from "./process"
import { recordRegistrationFailure } from "./record-failure"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const CONCURRENCY = clamp(Number(process.env.CLASS_REGISTER_WORKER_CONCURRENCY || 5) || 5, 1, 10)
const MAX_ATTEMPTS = clamp(Number(process.env.CLASS_REGISTER_MAX_ATTEMPTS || 3) || 3, 1, 10)
const RECONNECT_DELAY_MS = 15_000

async function handleMessage(prisma: PrismaClient, value: Buffer | null): Promise<void> {
  if (!value) return

  let job: RegistrationJobMessage
  try {
    job = JSON.parse(value.toString()) as RegistrationJobMessage
  } catch {
    console.warn("[register-worker] bỏ qua message không parse được")
    return
  }

  const baseStatus = {
    jobId: job.jobId,
    userId: job.userId,
    attempts: job.attempts,
    updatedAt: new Date().toISOString(),
  }

  await setJobStatus({
    ...baseStatus,
    status: "processing",
    message: "Đang xử lý đăng ký...",
  })

  try {
    await processRegistration(prisma, {
      userId: job.userId,
      sessionId: job.sessionId,
      subjectClassIds: job.subjectClassIds,
      curriculumVersionId: job.curriculumVersionId,
    })

    await setJobStatus({
      ...baseStatus,
      status: "success",
      message: "Đăng ký thành công",
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const regErr = toRegistrationError(err)

    // DB timeout / deadlock / pool cạn → transient, đáng để retry
    const retryable = regErr instanceof LockTimeoutError || regErr?.code === "VERSION_CONFLICT"

    if (retryable) {
      const attempts = job.attempts + 1

      if (attempts < MAX_ATTEMPTS) {
        // NACK: trả lại queue cho lần thử tiếp theo
        const requeued = await requeueRegistration({ ...job, attempts })
        if (requeued) {
          await setJobStatus({
            ...baseStatus,
            status: "pending",
            message: `Hệ thống đang bận, tự động thử lại (lần ${attempts + 1}/${MAX_ATTEMPTS})...`,
            attempts,
            updatedAt: new Date().toISOString(),
          })
          return
        }
        // Không requeue được (Kafka lỗi) → rơi xuống DLQ bên dưới
      }

      // Quá số lần retry → Dead Letter Queue
      await sendToDeadLetterQueue({ ...job, attempts })
      const overloadMessage =
        "Hệ thống đang quá tải, yêu cầu đăng ký chưa thực hiện được. Vui lòng thử lại sau ít phút."
      console.error(
        `[register-worker] job=${job.jobId} user=${job.userId} vào DLQ sau ${attempts} lần thử: ${regErr?.message}`
      )
      await setJobStatus({
        ...baseStatus,
        status: "failed",
        message: overloadMessage,
        attempts,
        updatedAt: new Date().toISOString(),
      })
      await recordRegistrationFailure(prisma, {
        jobId: job.jobId,
        userId: job.userId,
        sessionId: job.sessionId,
        subjectClassIds: job.subjectClassIds,
        code: regErr?.code ?? "LOCK_TIMEOUT",
        message: overloadMessage,
        attempts,
        occurredAt: job.timestamp || new Date().toISOString(),
      })
      return
    }

    if (regErr) {
      // Lỗi nghiệp vụ (hết chỗ, đã đăng ký, trùng lịch, thiếu tiên quyết...) → failed kèm lý do
      await setJobStatus({
        ...baseStatus,
        status: "failed",
        message: regErr.message,
        updatedAt: new Date().toISOString(),
      })
      await recordRegistrationFailure(prisma, {
        jobId: job.jobId,
        userId: job.userId,
        sessionId: job.sessionId,
        subjectClassIds: job.subjectClassIds,
        code: regErr.code,
        message: regErr.message,
        attempts: job.attempts,
        occurredAt: job.timestamp || new Date().toISOString(),
      })
      return
    }

    console.error(`[register-worker] job=${job.jobId} lỗi không xác định`, err)
    const systemMessage = "Lỗi hệ thống. Vui lòng thử lại."
    await setJobStatus({
      ...baseStatus,
      status: "failed",
      message: systemMessage,
      updatedAt: new Date().toISOString(),
    })
    await recordRegistrationFailure(prisma, {
      jobId: job.jobId,
      userId: job.userId,
      sessionId: job.sessionId,
      subjectClassIds: job.subjectClassIds,
      code: "SYSTEM_ERROR",
      message: systemMessage,
      attempts: job.attempts,
      occurredAt: job.timestamp || new Date().toISOString(),
    })
  }
}

/**
 * Khởi động worker (chạy nền, không block server).
 * Kafka chưa sẵn sàng → tự thử kết nối lại mỗi 15s.
 */
export function startRegistrationWorker(prisma: PrismaClient): void {
  if (!KAFKA_ENABLED) {
    console.log("[register-worker] KAFKA_BROKERS chưa cấu hình → đăng ký chạy chế độ đồng bộ")
    return
  }
  if (process.env.CLASS_REGISTER_WORKER_ENABLED === "false") {
    console.log("[register-worker] worker bị tắt qua CLASS_REGISTER_WORKER_ENABLED=false")
    return
  }

  void runConsumer(prisma)
}

async function runConsumer(prisma: PrismaClient): Promise<void> {
  const kafka = getKafka()
  if (!kafka) return

  const consumer = kafka.consumer({ groupId: REGISTRATION_CONSUMER_GROUP })

  try {
    await consumer.connect()
    await consumer.subscribe({ topic: REGISTRATION_TOPIC, fromBeginning: false })
    console.log(
      `[register-worker] listening topic=${REGISTRATION_TOPIC} concurrency=${CONCURRENCY} maxAttempts=${MAX_ATTEMPTS}`
    )

    const shutdown = async () => {
      try {
        await consumer.disconnect()
      } catch {
        /* ignore */
      }
    }
    process.once("SIGINT", shutdown)
    process.once("SIGTERM", shutdown)

    await consumer.run({
      eachBatchAutoResolve: false,
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        const messages = batch.messages
        // Xử lý theo chunk CONCURRENCY message song song — chặn trần tải lên DB
        for (let i = 0; i < messages.length; i += CONCURRENCY) {
          if (!isRunning() || isStale()) break
          const chunk = messages.slice(i, i + CONCURRENCY)
          await Promise.all(chunk.map((message) => handleMessage(prisma, message.value)))
          for (const message of chunk) {
            resolveOffset(message.offset)
          }
          await heartbeat()
        }
      },
    })
  } catch (e) {
    console.error(
      `[register-worker] Kafka lỗi, thử kết nối lại sau ${RECONNECT_DELAY_MS / 1000}s`,
      e
    )
    try {
      await consumer.disconnect()
    } catch {
      /* ignore */
    }
    setTimeout(() => void runConsumer(prisma), RECONNECT_DELAY_MS)
  }
}
