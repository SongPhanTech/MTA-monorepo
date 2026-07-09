import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import type { PrismaClient } from "@workspace/db"

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = "Asia/Ho_Chi_Minh"
const MAC_DINH_INTERVAL_MS = 24 * 60 * 60_000 // 24h
const MAC_DINH_SO_NGAY_GIU = 30

const layIntervalMs = () => {
  const raw = process.env.CRON_DON_DEP_THONG_BAO_INTERVAL_MS
  if (!raw) return MAC_DINH_INTERVAL_MS
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 60_000 ? parsed : MAC_DINH_INTERVAL_MS
}

const laySoNgayGiu = () => {
  const raw = process.env.CRON_DON_DEP_THONG_BAO_KEEP_DAYS
  if (!raw) return MAC_DINH_SO_NGAY_GIU
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MAC_DINH_SO_NGAY_GIU
}

async function chayJobDonDepThongBao(prisma: PrismaClient) {
  const soNgayGiu = laySoNgayGiu()
  const mocXoa = dayjs().tz(TZ).subtract(soNgayGiu, "day").startOf("day").toDate()
  console.log(
    `[cron-don-dep-thong-bao] Bắt đầu dọn thông báo cũ hơn ${soNgayGiu} ngày (mốc: ${mocXoa.toISOString()})`
  )

  /**
   * Lưu ý:
   * Hiện Notification chưa có trạng thái đã đọc/chưa đọc lưu ở DB.
   * Vì vậy cron chỉ có thể dọn theo tuổi thông báo (publishedAt), chưa thể lọc "đã đọc".
   */
  const ketQua = await prisma.notification.deleteMany({
    where: {
      deletedAt: null,
      publishedAt: { lt: mocXoa },
    },
  })

  console.log(`[cron-don-dep-thong-bao] Hoàn tất, đã xóa ${ketQua.count} thông báo`)
}

function startDonDepThongBaoCron(prisma: PrismaClient) {
  const envBat = process.env.CRON_DON_DEP_THONG_BAO_ENABLED !== "false"
  if (!envBat) {
    console.log("[cron-don-dep-thong-bao] Đã tắt (CRON_DON_DEP_THONG_BAO_ENABLED=false)")
    return
  }

  const intervalMs = layIntervalMs()
  console.log(
    `[cron-don-dep-thong-bao] Bật cron — chạy mỗi ${Math.round(intervalMs / 1000)}s, giữ ${laySoNgayGiu()} ngày gần nhất`
  )

  void chayJobDonDepThongBao(prisma).catch((error) => {
    console.error("[cron-don-dep-thong-bao] Lỗi khi chạy lần đầu:", error)
  })

  setInterval(() => {
    void chayJobDonDepThongBao(prisma).catch((error) => {
      console.error("[cron-don-dep-thong-bao] Lỗi khi dọn thông báo:", error)
    })
  }, intervalMs)
}

export { chayJobDonDepThongBao, startDonDepThongBaoCron }
