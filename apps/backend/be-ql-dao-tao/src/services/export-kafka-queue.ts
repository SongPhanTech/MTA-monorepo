/**
 * Kafka Queue cho xuất dữ liệu đào tạo (be-ql-dao-tao).
 * - Topic: export_training_data_queue
 * - Tự động fallback chạy nền in-process khi KAFKA_BROKERS chưa cấu hình.
 */

export const EXPORT_TRAINING_DATA_TOPIC =
  process.env.EXPORT_TRAINING_DATA_TOPIC || "export_training_data_queue"
export const EXPORT_TRAINING_DATA_CONSUMER_GROUP =
  process.env.EXPORT_TRAINING_DATA_CONSUMER_GROUP || "be-ql-dao-tao-export-worker"

const BROKERS = (process.env.KAFKA_BROKERS || "")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean)

export const hasKafkaBrokers = BROKERS.length > 0
export const KAFKA_ENABLED = hasKafkaBrokers && process.env.EXPORT_ASYNC_KAFKA !== "false"

export type ExportJobMessage = {
  jobId: string
  classRegisterSessionId?: string
  timestamp: string
}

let kafkaInstance: any = null
let producer: any = null

async function getKafka() {
  if (!KAFKA_ENABLED) return null
  if (kafkaInstance) return kafkaInstance

  try {
    const { Kafka, logLevel } = await import("kafkajs")
    kafkaInstance = new Kafka({
      clientId: "be-ql-dao-tao-export",
      brokers: BROKERS,
      logLevel: logLevel.ERROR,
    })
    return kafkaInstance
  } catch (err) {
    console.warn("[export-kafka] Chưa cài kafkajs hoặc lỗi khởi tạo, fallback in-process:", err)
    return null
  }
}

async function getProducer() {
  if (producer) return producer
  const kafka = await getKafka()
  if (!kafka) return null

  try {
    const p = kafka.producer()
    await p.connect()
    producer = p
    console.log(`[export-kafka] Producer connected to brokers: ${BROKERS.join(", ")}`)
    return producer
  } catch (err) {
    console.warn("[export-kafka] Lỗi kết nối Kafka Producer:", err)
    return null
  }
}

export async function enqueueExportJob(job: ExportJobMessage): Promise<boolean> {
  const p = await getProducer()
  if (!p) return false

  try {
    await p.send({
      topic: EXPORT_TRAINING_DATA_TOPIC,
      messages: [
        {
          key: job.jobId,
          value: JSON.stringify(job),
        },
      ],
    })
    console.log(`[export-kafka] Đã đẩy job ${job.jobId} vào topic ${EXPORT_TRAINING_DATA_TOPIC}`)
    return true
  } catch (err) {
    console.warn(`[export-kafka] Gửi Kafka thất bại cho job ${job.jobId}:`, err)
    return false
  }
}

export async function startExportConsumer(
  handler: (job: ExportJobMessage) => Promise<void>
): Promise<void> {
  const kafka = await getKafka()
  if (!kafka) {
    console.log("[export-kafka] Kafka không khả dụng → Export worker chạy chế độ in-process")
    return
  }

  try {
    const consumer = kafka.consumer({ groupId: EXPORT_TRAINING_DATA_CONSUMER_GROUP })
    await consumer.connect()
    await consumer.subscribe({ topic: EXPORT_TRAINING_DATA_TOPIC, fromBeginning: false })
    console.log(
      `[export-kafka] Consumer đã kết nối topic ${EXPORT_TRAINING_DATA_TOPIC} (group: ${EXPORT_TRAINING_DATA_CONSUMER_GROUP})`
    )

    await consumer.run({
      eachMessage: async ({ message }: any) => {
        if (!message.value) return
        try {
          const job = JSON.parse(message.value.toString()) as ExportJobMessage
          await handler(job)
        } catch (e) {
          console.error("[export-kafka] Lỗi xử lý message từ Kafka:", e)
        }
      },
    })
  } catch (err) {
    console.warn("[export-kafka] Lỗi khởi động Consumer:", err)
  }
}
