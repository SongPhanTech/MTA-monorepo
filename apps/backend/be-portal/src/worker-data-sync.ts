/**
 * Entrypoint worker-only: consume Kafka data_sync_import_queue.
 * Dùng image be-portal, CMD: bun worker-data-sync.js
 */
import { prisma } from "./prisma"
import { startDataSyncWorker } from "./services/data-sync/worker"

startDataSyncWorker(prisma)

process.on("SIGINT", () => {
  process.exit()
})
process.on("SIGTERM", () => {
  process.exit()
})
