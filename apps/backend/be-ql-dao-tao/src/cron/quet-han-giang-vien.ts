import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import type { PrismaClient } from "@workspace/db"
import { layCauHinhCronQuetHanGv } from "../lib/cau-hinh-cron-quet-han-gv"
import { quetVaThongBaoHanGiangVien } from "../lib/thong-bao-giang-vien"

dayjs.extend(utc)
dayjs.extend(timezone)

const taoKhoaChay = (tz: string) => dayjs().tz(tz).format("YYYY-MM-DD-HH")

const tinhMsDenLanChayTiep = (gioChay: number[], tz: string): number => {
  const now = dayjs().tz(tz)
  const sorted = [...gioChay].sort((a, b) => a - b)

  if (!sorted.length) {
    return 60 * 60_000
  }

  for (const gio of sorted) {
    const moc = now.hour(gio).minute(0).second(0).millisecond(0)
    if (moc.isAfter(now)) {
      return moc.diff(now)
    }
  }

  const sangHomSau = now
    .add(1, "day")
    .hour(sorted[0]!)
    .minute(0)
    .second(0)
    .millisecond(0)
  return sangHomSau.diff(now)
}

async function chayJobQuetHan(prisma: PrismaClient, tz: string) {
  const slotKey = taoKhoaChay(tz)
  console.log(`[cron-quet-han-gv] Bắt đầu quét hạn GV (slot: ${slotKey})`)

  try {
    const ketQua = await quetVaThongBaoHanGiangVien(prisma, slotKey)
    console.log(
      `[cron-quet-han-gv] Hoàn tất: ${ketQua.daTao}/${ketQua.daQuet} thông báo mới (bỏ qua trùng mã)`
    )
  } catch (error) {
    console.error("[cron-quet-han-gv] Lỗi khi quét hạn giảng viên:", error)
  }
}

/** Bật cron quét hạn GV theo lịch trong Config (LECTURER_DEADLINE_CRON_SCHEDULE). */
function startQuetHanGiangVienCron(prisma: PrismaClient) {
  const envBat = process.env.CRON_QUET_HAN_GV_ENABLED !== "false"

  if (!envBat) {
    console.log("[cron-quet-han-gv] Đã tắt (CRON_QUET_HAN_GV_ENABLED=false)")
    return
  }

  const lapLich = async () => {
    const cauHinh = await layCauHinhCronQuetHanGv(prisma)
    const tz = cauHinh.timezone

    if (!cauHinh.enabled) {
      console.log("[cron-quet-han-gv] Đã tắt trong cấu hình hệ thống (enabled=false)")
      setTimeout(() => {
        void lapLich()
      }, 5 * 60_000)
      return
    }

    if (!cauHinh.hours.length) {
      console.log("[cron-quet-han-gv] Chưa có mốc giờ quét — kiểm tra lại sau 5 phút")
      setTimeout(() => {
        void lapLich()
      }, 5 * 60_000)
      return
    }

    const delay = tinhMsDenLanChayTiep(cauHinh.hours, tz)
    const phut = Math.round(delay / 60_000)
    console.log(
      `[cron-quet-han-gv] Lịch: ${cauHinh.hours.map((h: number) => `${h}h`).join(", ")} (${tz}) — lần chạy tiếp theo sau ~${phut} phút`
    )

    setTimeout(async () => {
      await chayJobQuetHan(prisma, tz)
      await lapLich()
    }, delay)
  }

  console.log("[cron-quet-han-gv] Bật cron — đọc lịch từ Config LECTURER_DEADLINE_CRON_SCHEDULE")
  void lapLich()
}

export { chayJobQuetHan, startQuetHanGiangVienCron }
