/**
 * Hàng đợi đăng ký học trên Kafka.
 *
 * - Topic chính:  course_registration_queue      — producer (API) đẩy vào, worker tiêu thụ
 * - Topic DLQ:    course_registration_queue_dlq  — message fail quá CLASS_REGISTER_MAX_ATTEMPTS lần
 * - Topic events: course_registration_events     — sự kiện fail để thống kê / analytics
 *
 * Message được key theo userId → các yêu cầu của cùng một sinh viên vào cùng partition,
 * đảm bảo xử lý đúng thứ tự bấm của sinh viên đó.
 *
 * Fault tolerance: Kafka không kết nối được → enqueue trả false, API tự fallback
 * xử lý đồng bộ (registration vẫn hoạt động, chỉ mất tính năng hàng đợi).
 */
import { Kafka, Partitioners, logLevel, type Producer } from "kafkajs"
import type { RegistrationFailedEvent } from "./persist-attempt"

export const REGISTRATION_TOPIC = "course_registration_queue"
export const REGISTRATION_DLQ_TOPIC = "course_registration_queue_dlq"
export const REGISTRATION_EVENTS_TOPIC =
  process.env.CLASS_REGISTER_EVENTS_TOPIC || "course_registration_events"
export const REGISTRATION_CONSUMER_GROUP =
  process.env.CLASS_REGISTER_CONSUMER_GROUP || "be-portal-class-register-worker"
export const REGISTRATION_EVENTS_CONSUMER_GROUP =
  process.env.CLASS_REGISTER_EVENTS_CONSUMER_GROUP || "be-portal-class-register-events"

const BROKERS = (process.env.KAFKA_BROKERS || "")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean)

export const hasKafkaBrokers = BROKERS.length > 0

/** Bật luồng bất đồng bộ đăng ký khi có KAFKA_BROKERS và không bị tắt qua env */
export const KAFKA_ENABLED = hasKafkaBrokers && process.env.CLASS_REGISTER_ASYNC !== "false"

export type RegistrationJobMessage = {
  jobId: string
  userId: string
  sessionId: string
  subjectClassIds: string[]
  curriculumVersionId?: string
  /** Thời điểm sinh viên bấm đăng ký */
  timestamp: string
  /** Số lần đã xử lý thất bại (retry counter) */
  attempts: number
}

export type { RegistrationFailedEvent }

let kafka: Kafka | null = null

export function getKafka(): Kafka | null {
  if (!hasKafkaBrokers) return null
  if (!kafka) {
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "be-portal",
      brokers: BROKERS,
      logLevel: logLevel.ERROR,
      connectionTimeout: Number(process.env.KAFKA_CONNECTION_TIMEOUT || 5000),
      requestTimeout: Number(process.env.KAFKA_REQUEST_TIMEOUT || 10000),
      retry: { retries: 3 },
    })
  }
  return kafka
}

let producer: Producer | null = null
let producerConnecting: Promise<Producer | null> | null = null

async function getProducer(): Promise<Producer | null> {
  const client = getKafka()
  if (!client) return null
  if (producer) return producer
  if (producerConnecting) return producerConnecting

  producerConnecting = (async () => {
    try {
      const p = client.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
        allowAutoTopicCreation: true,
      })
      await p.connect()
      producer = p
      console.log(`[kafka-queue] producer connected brokers=${BROKERS.join(",")}`)
      return producer
    } catch (e) {
      console.warn("[kafka-queue] producer connect failed", e)
      producer = null
      return null
    } finally {
      producerConnecting = null
    }
  })()

  return producerConnecting
}

export async function produceKafkaMessage(
  topic: string,
  key: string,
  value: unknown
): Promise<boolean> {
  try {
    const p = await getProducer()
    if (!p) return false
    await p.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }],
    })
    return true
  } catch (e) {
    console.warn(`[kafka-queue] produce failed topic=${topic}`, e)
    try {
      await producer?.disconnect()
    } catch {
      /* ignore */
    }
    producer = null
    return false
  }
}

/** Producer (API đăng ký): đẩy job vào queue. false = Kafka lỗi → caller fallback sync. */
export async function enqueueRegistration(message: RegistrationJobMessage): Promise<boolean> {
  return produceKafkaMessage(REGISTRATION_TOPIC, message.userId, message)
}

/** NACK: trả message về queue để retry (attempts đã tăng). */
export async function requeueRegistration(message: RegistrationJobMessage): Promise<boolean> {
  return produceKafkaMessage(REGISTRATION_TOPIC, message.userId, message)
}

/** Quá số lần retry → đẩy vào Dead Letter Queue để xử lý thủ công/giám sát. */
export async function sendToDeadLetterQueue(message: RegistrationJobMessage): Promise<boolean> {
  return produceKafkaMessage(REGISTRATION_DLQ_TOPIC, message.userId, message)
}

/**
 * Phát sự kiện đăng ký thất bại lên topic events.
 * Trả false nếu Kafka tắt / lỗi — caller phải fallback ghi DB trực tiếp.
 */
export async function publishRegistrationEvent(event: RegistrationFailedEvent): Promise<boolean> {
  if (!KAFKA_ENABLED) return false
  return produceKafkaMessage(REGISTRATION_EVENTS_TOPIC, event.userId, event)
}
