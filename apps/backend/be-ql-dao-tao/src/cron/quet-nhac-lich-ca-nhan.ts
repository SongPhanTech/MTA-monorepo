import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import type { PrismaClient } from "@workspace/db"
import { quetVaThongBaoLichCaNhan } from "../lib/thong-bao-lich-ca-nhan"

dayjs.extend(utc)
dayjs.extend(timezone)

const MAC_DINH_INTERVAL_MS = 60_000

const layIntervalMs = () => {
  const raw = process.env.CRON_QUET_LICH_CA_NHAN_INTERVAL_MS
  if (!raw) return MAC_DINH_INTERVAL_MS
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 10_000 ? parsed : MAC_DINH_INTERVAL_MS
}

async function chayJobQuetLichCaNhan(prisma: PrismaClient) {
  const slotKey = dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD-HH-mm")
  console.log(`[cron-quet-lich-ca-nhan] Bắt đầu quét nhắc lịch cá nhân (slot: ${slotKey})`)

  try {
    const ketQua = await quetVaThongBaoLichCaNhan(prisma, slotKey)
    if (ketQua.daQuet > 0) {
      console.log(
        `[cron-quet-lich-ca-nhan] Hoàn tất: ${ketQua.daTao}/${ketQua.daQuet} thông báo mới (bỏ qua trùng mã)`
      )
    }
  } catch (error) {
    console.error("[cron-quet-lich-ca-nhan] Lỗi khi quét nhắc lịch cá nhân:", error)
  }
}

/** Bật cron quét IndividualSchedule theo reminderMinutes (mặc định mỗi 1 phút). */
function startQuetNhacLichCaNhanCron(prisma: PrismaClient) {
  const envBat = process.env.CRON_QUET_LICH_CA_NHAN_ENABLED !== "false"

  if (!envBat) {
    console.log("[cron-quet-lich-ca-nhan] Đã tắt (CRON_QUET_LICH_CA_NHAN_ENABLED=false)")
    return
  }

  const intervalMs = layIntervalMs()
  console.log(
    `[cron-quet-lich-ca-nhan] Bật cron — quét mỗi ${Math.round(intervalMs / 1000)}s (CRON_QUET_LICH_CA_NHAN_INTERVAL_MS)`
  )

  void chayJobQuetLichCaNhan(prisma)
  setInterval(() => {
    void chayJobQuetLichCaNhan(prisma)
  }, intervalMs)
}

export { chayJobQuetLichCaNhan, startQuetNhacLichCaNhanCron }
