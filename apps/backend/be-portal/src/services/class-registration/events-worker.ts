/**
 * Consumer topic course_registration_events → ghi ClassRegisterAttempt.
 */
import type { PrismaClient } from "@workspace/db"
import {
  KAFKA_ENABLED,
  REGISTRATION_EVENTS_CONSUMER_GROUP,
  REGISTRATION_EVENTS_TOPIC,
  getKafka,
} from "./kafka-queue"
import { persistFailedAttempt, type RegistrationFailedEvent } from "./persist-attempt"

const RECONNECT_DELAY_MS = 15_000

async function handleEventMessage(prisma: PrismaClient, value: Buffer | null): Promise<void> {
  if (!value) return
  let event: RegistrationFailedEvent
  try {
    event = JSON.parse(value.toString()) as RegistrationFailedEvent
  } catch {
    console.warn("[register-events] bỏ qua message không parse được")
    return
  }
  if (event.type !== "registration_failed") return
  if (!event.userId || !event.sessionId || !event.message) {
    console.warn("[register-events] message thiếu field bắt buộc", event)
    return
  }
  await persistFailedAttempt(prisma, {
    ...event,
    subjectClassIds: Array.isArray(event.subjectClassIds) ? event.subjectClassIds : [],
    occurredAt: event.occurredAt || new Date().toISOString(),
    attempts: event.attempts ?? 0,
  })
}

export function startRegistrationEventsWorker(prisma: PrismaClient): void {
  if (!KAFKA_ENABLED) {
    console.log("[register-events] KAFKA_BROKERS chưa cấu hình → bỏ qua consumer events")
    return
  }
  if (process.env.CLASS_REGISTER_EVENTS_WORKER_ENABLED === "false") {
    console.log("[register-events] worker bị tắt qua CLASS_REGISTER_EVENTS_WORKER_ENABLED=false")
    return
  }
  void runEventsConsumer(prisma)
}

async function runEventsConsumer(prisma: PrismaClient): Promise<void> {
  const kafka = getKafka()
  if (!kafka) return

  const consumer = kafka.consumer({ groupId: REGISTRATION_EVENTS_CONSUMER_GROUP })

  try {
    await consumer.connect()
    await consumer.subscribe({ topic: REGISTRATION_EVENTS_TOPIC, fromBeginning: false })
    console.log(`[register-events] listening topic=${REGISTRATION_EVENTS_TOPIC}`)

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
      eachMessage: async ({ message }) => {
        await handleEventMessage(prisma, message.value)
      },
    })
  } catch (e) {
    console.error(
      `[register-events] Kafka lỗi, thử kết nối lại sau ${RECONNECT_DELAY_MS / 1000}s`,
      e
    )
    try {
      await consumer.disconnect()
    } catch {
      /* ignore */
    }
    setTimeout(() => void runEventsConsumer(prisma), RECONNECT_DELAY_MS)
  }
}
