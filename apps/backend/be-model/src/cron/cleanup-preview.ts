import { MinIOService } from "../services/minio"

/** Prefix chứa các file Excel preview tạm (route /api/excel-template/preview). */
const PREVIEW_PREFIX = process.env.PREVIEW_CLEANUP_PREFIX || "mta/preview/"

/** File preview cũ hơn số phút này sẽ bị xoá. Default 1 tuần (10080 phút). */
const MAX_AGE_MINUTES = Number.parseInt(process.env.PREVIEW_CLEANUP_MAX_AGE_MINUTES || "10080", 10)

/** Chu kỳ quét. Default 6 giờ/lần (360 phút). */
const INTERVAL_MINUTES = Number.parseInt(process.env.PREVIEW_CLEANUP_INTERVAL_MINUTES || "360", 10)

const MAX_AGE_MS = MAX_AGE_MINUTES * 60 * 1000
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000

const minioService = new MinIOService()

async function runCleanup() {
  try {
    const removed = await minioService.removeStaleObjects(PREVIEW_PREFIX, MAX_AGE_MS)
    if (removed > 0) {
      console.log(
        `[cleanup-preview] Đã xoá ${removed} file preview cũ hơn ${MAX_AGE_MINUTES} phút trong "${PREVIEW_PREFIX}"`
      )
    }
  } catch (error) {
    console.error("[cleanup-preview] Lỗi khi dọn file preview:", error)
  }
}

/** Bật cron dọn file preview: chạy ngay khi khởi động rồi lặp lại định kỳ. */
export function startPreviewCleanupCron() {
  console.log(
    `[cleanup-preview] Bật cron: xoá file trong "${PREVIEW_PREFIX}" cũ hơn ${MAX_AGE_MINUTES} phút, quét mỗi ${INTERVAL_MINUTES} phút`
  )
  void runCleanup()
  setInterval(() => void runCleanup(), INTERVAL_MS)
}
