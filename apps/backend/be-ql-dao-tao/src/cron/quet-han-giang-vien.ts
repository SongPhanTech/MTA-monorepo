import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import type { PrismaClient } from "@workspace/db"
import { quetVaThongBaoHanGiangVien } from "../lib/thong-bao-giang-vien"

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = "Asia/Ho_Chi_Minh"
/** Các mốc chạy job trong ngày (giờ VN). */
const GIO_CHAY = [0, 12] as const

const taoKhoaChay = () => dayjs().tz(TZ).format("YYYY-MM-DD-HH")

const tinhMsDenLanChayTiep = (): number => {
  const now = dayjs().tz(TZ)

  for (const gio of GIO_CHAY) {
    const moc = now.hour(gio).minute(0).second(0).millisecond(0)
    if (moc.isAfter(now)) {
      return moc.diff(now)
    }
  }

  const sangHomSau = now.add(1, "day").hour(GIO_CHAY[0]).minute(0).second(0).millisecond(0)
  return sangHomSau.diff(now)
}

async function chayJobQuetHan(prisma: PrismaClient) {
  const slotKey = taoKhoaChay()
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

/** Bật cron quét hạn GV: chạy lúc 00:00 và 12:00 (Asia/Ho_Chi_Minh) mỗi ngày. */
function startQuetHanGiangVienCron(prisma: PrismaClient) {
  const bat = process.env.CRON_QUET_HAN_GV_ENABLED !== "false"

  if (!bat) {
    console.log("[cron-quet-han-gv] Đã tắt (CRON_QUET_HAN_GV_ENABLED=false)")
    return
  }

  console.log(
    `[cron-quet-han-gv] Bật cron: quét hạn nhập điểm & khảo sát lúc ${GIO_CHAY.join("h, ")}h (${TZ})`
  )

  const lapLich = () => {
    const delay = tinhMsDenLanChayTiep()
    const phut = Math.round(delay / 60_000)
    console.log(`[cron-quet-han-gv] Lần chạy tiếp theo sau ~${phut} phút`)

    setTimeout(async () => {
      await chayJobQuetHan(prisma)
      lapLich()
    }, delay)
  }

  lapLich()
}

export { chayJobQuetHan, startQuetHanGiangVienCron }
