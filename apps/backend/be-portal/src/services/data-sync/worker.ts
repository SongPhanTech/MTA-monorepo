/**
 * Worker đồng bộ dữ liệu — consume Kafka data_sync_import_queue, import JSON vào DB.
 *
 * Concurrency mặc định 1 (import nặng, không chạy song song).
 * Retry transient (DB timeout) tối đa DATA_SYNC_MAX_ATTEMPTS lần rồi đẩy DLQ.
 */
import type { PrismaClient } from "@workspace/db"
import { removeImportFile } from "./import-file-store"
import {
  DATA_SYNC_CONSUMER_GROUP,
  DATA_SYNC_IMPORT_TOPIC,
  DATA_SYNC_KAFKA_ENABLED,
  requeueDataSyncImport,
  sendDataSyncImportToDlq,
  type DataSyncImportJob,
} from "./kafka-queue"
import { getKafka } from "../class-registration/kafka-queue"
import { processImportFromFile } from "../import-training-data"
import { markDataSyncHistoryFailed, markDataSyncHistorySuccess } from "../data-sync-history"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const CONCURRENCY = clamp(Number(process.env.DATA_SYNC_WORKER_CONCURRENCY || 1) || 1, 1, 2)
const MAX_ATTEMPTS = clamp(Number(process.env.DATA_SYNC_MAX_ATTEMPTS || 3) || 3, 1, 10)
const RECONNECT_DELAY_MS = 15_000

function isRetryable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /P2024|P2028|timed out|timeout|deadlock|40P01|55P03|Unable to start a transaction/i.test(
    msg
  )
}

async function handleMessage(value: Buffer | null): Promise<void> {
  if (!value) return

  let job: DataSyncImportJob
  try {
    job = JSON.parse(value.toString()) as DataSyncImportJob
  } catch {
    console.warn("[data-sync-worker] bỏ qua message không parse được")
    return
  }

  if (!job.syncHistoryId || !job.filePath) {
    console.warn("[data-sync-worker] message thiếu syncHistoryId/filePath", job)
    return
  }

  console.log(
    `[data-sync-worker] bắt đầu history=${job.syncHistoryId} file=${job.filePath} attempts=${job.attempts}`
  )

  try {
    const result = await processImportFromFile(job.filePath)
    const description =
      result.warnings.length > 0
        ? result.warnings.slice(0, 80).join("\n")
        : result.steps.map((s) => `${s.table}: ${s.count}`).join(", ")
    await markDataSyncHistorySuccess(job.syncHistoryId, {
      classRegisterSessionId: result.sessionId,
      description,
    })
    await removeImportFile(job.filePath)
    console.log(
      `[data-sync-worker] xong history=${job.syncHistoryId} session=${result.sessionName} warnings=${result.warnings.length}`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nhập dữ liệu thất bại"
    console.error(`[data-sync-worker] lỗi history=${job.syncHistoryId}`, error)

    if (isRetryable(error) && job.attempts + 1 < MAX_ATTEMPTS) {
      const attempts = job.attempts + 1
      const requeued = await requeueDataSyncImport({ ...job, attempts })
      if (requeued) {
        console.warn(
          `[data-sync-worker] retry history=${job.syncHistoryId} lần ${attempts + 1}/${MAX_ATTEMPTS}`
        )
        return
      }
    }

    await sendDataSyncImportToDlq({ ...job, attempts: job.attempts + 1 })
    await markDataSyncHistoryFailed(job.syncHistoryId, message).catch((e) => {
      console.error("[data-sync-worker] không ghi được FAILED", e)
    })
    await removeImportFile(job.filePath)
  }
}

export function startDataSyncWorker(_prisma?: PrismaClient): void {
  if (!DATA_SYNC_KAFKA_ENABLED) {
    console.log("[data-sync-worker] Kafka chưa cấu hình → import fallback in-process")
    return
  }
  if (process.env.DATA_SYNC_WORKER_ENABLED === "false") {
    console.log("[data-sync-worker] tắt qua DATA_SYNC_WORKER_ENABLED=false")
    return
  }

  void runConsumer()
}

async function runConsumer(): Promise<void> {
  const kafka = getKafka()
  if (!kafka) return

  const consumer = kafka.consumer({ groupId: DATA_SYNC_CONSUMER_GROUP })

  try {
    await consumer.connect()
    await consumer.subscribe({ topic: DATA_SYNC_IMPORT_TOPIC, fromBeginning: false })
    console.log(
      `[data-sync-worker] listening topic=${DATA_SYNC_IMPORT_TOPIC} concurrency=${CONCURRENCY} maxAttempts=${MAX_ATTEMPTS}`
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
        for (let i = 0; i < messages.length; i += CONCURRENCY) {
          if (!isRunning() || isStale()) break
          const chunk = messages.slice(i, i + CONCURRENCY)
          await Promise.all(chunk.map((message) => handleMessage(message.value)))
          for (const message of chunk) {
            resolveOffset(message.offset)
          }
          await heartbeat()
        }
      },
    })
  } catch (e) {
    console.error(
      `[data-sync-worker] Kafka lỗi, thử kết nối lại sau ${RECONNECT_DELAY_MS / 1000}s`,
      e
    )
    try {
      await consumer.disconnect()
    } catch {
      /* ignore */
    }
    setTimeout(() => void runConsumer(), RECONNECT_DELAY_MS)
  }
}
