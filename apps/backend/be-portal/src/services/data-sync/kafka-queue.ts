/**
 * Hàng đợi đồng bộ dữ liệu (import JSON nội bộ → portal) trên Kafka.
 *
 * - Topic chính: data_sync_import_queue
 * - Topic DLQ:   data_sync_import_queue_dlq
 *
 * Message chỉ chứa syncHistoryId (+ fileName). JSON lớn nằm Redis:
 * portal:import_payload:{syncHistoryId}
 */
import { hasKafkaBrokers, produceKafkaMessage } from "../class-registration/kafka-queue"

export const DATA_SYNC_IMPORT_TOPIC = process.env.DATA_SYNC_IMPORT_TOPIC || "data_sync_import_queue"
export const DATA_SYNC_IMPORT_DLQ_TOPIC =
  process.env.DATA_SYNC_IMPORT_DLQ_TOPIC || "data_sync_import_queue_dlq"
export const DATA_SYNC_CONSUMER_GROUP =
  process.env.DATA_SYNC_CONSUMER_GROUP || "be-portal-data-sync-worker"

export const DATA_SYNC_KAFKA_ENABLED = hasKafkaBrokers && process.env.DATA_SYNC_ASYNC !== "false"

export type DataSyncImportJob = {
  syncHistoryId: string
  /** @deprecated Payload đã chuyển Redis; giữ optional cho message cũ trên queue */
  filePath?: string
  fileName?: string
  timestamp: string
  attempts: number
}

export async function enqueueDataSyncImport(job: DataSyncImportJob): Promise<boolean> {
  if (!DATA_SYNC_KAFKA_ENABLED) return false
  return produceKafkaMessage(DATA_SYNC_IMPORT_TOPIC, job.syncHistoryId, job)
}

export async function requeueDataSyncImport(job: DataSyncImportJob): Promise<boolean> {
  return produceKafkaMessage(DATA_SYNC_IMPORT_TOPIC, job.syncHistoryId, job)
}

export async function sendDataSyncImportToDlq(job: DataSyncImportJob): Promise<boolean> {
  return produceKafkaMessage(DATA_SYNC_IMPORT_DLQ_TOPIC, job.syncHistoryId, job)
}
