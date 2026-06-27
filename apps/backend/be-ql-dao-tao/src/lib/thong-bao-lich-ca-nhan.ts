import type { NotificationPriority, NotificationType, PrismaClient } from "@workspace/db"
import dayjs, { type Dayjs } from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = "Asia/Ho_Chi_Minh"
const FMT_NGAY_GIO = "DD/MM/YYYY HH:mm"

type LichCaNhanQuet = {
  id: string
  title: string
  startTime: Date
  allDay: boolean
  location: string | null
  content: string | null
  reminderMinutes: number | null
  lecturerId: string
}

type ThongBaoJobInput = {
  lecturerId: string
  type: NotificationType
  title: string
  content: string
  expiresAt?: Date | null
  priority: NotificationPriority
  code: string
}

const formatThoiGian = (value: Date, allDay: boolean) => {
  const d = dayjs(value).tz(TZ)
  return allDay ? d.format("DD/MM/YYYY") + " (cả ngày)" : d.format(FMT_NGAY_GIO)
}

const formatNhanNhac = (phut: number) => {
  if (phut >= 1440 && phut % 1440 === 0) {
    const ngay = phut / 1440
    return ngay === 1 ? "1 ngày" : `${ngay} ngày`
  }
  if (phut >= 60 && phut % 60 === 0) {
    const gio = phut / 60
    return gio === 1 ? "1 giờ" : `${gio} giờ`
  }
  return `${phut} phút`
}

const maThongBaoCron = (scheduleId: string, lecturerId: string, batDau: Dayjs) =>
  `CRON-INDIVIDUAL_SCHEDULE-${scheduleId}-${lecturerId}-${batDau.format("YYYY-MM-DD-HH-mm")}`

const trongCuaSoNhac = (now: Dayjs, batDau: Dayjs, reminderMinutes: number) => {
  const lucNhac = batDau.subtract(reminderMinutes, "minute")
  return (now.isAfter(lucNhac) || now.isSame(lucNhac)) && now.isBefore(batDau)
}

const taoNoiDung = (lich: LichCaNhanQuet, batDau: Dayjs, reminderMinutes: number) => {
  const thoiGian = formatThoiGian(batDau.toDate(), lich.allDay)
  const nhanNhac = formatNhanNhac(reminderMinutes)
  const diaDiem = lich.location?.trim()
  const noiDung = lich.content?.trim()

  return [
    `Sự kiện bắt đầu lúc <strong>${thoiGian}</strong> (nhắc trước ${nhanNhac}).`,
    diaDiem ? `Địa điểm: ${diaDiem}.` : null,
    noiDung ? `Nội dung: ${noiDung}.` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

async function taoThongBaoCoMa(prisma: PrismaClient, danhSach: ThongBaoJobInput[]) {
  if (!danhSach.length) return 0

  const result = await prisma.notification.createMany({
    data: danhSach.map((item) => ({
      code: item.code,
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      lecturerId: item.lecturerId,
      active: true,
      targetAll: false,
      publishedAt: new Date(),
      expiresAt: item.expiresAt ?? undefined,
    })),
    skipDuplicates: true,
  })

  return result.count
}

/** Quét IndividualSchedule có reminderMinutes, đẩy Notification INDIVIDUAL_SCHEDULE khi đến giờ nhắc. */
async function quetVaThongBaoLichCaNhan(prisma: PrismaClient, _slotKey: string) {
  const now = dayjs().tz(TZ)

  const danhSachLich = await prisma.individualSchedule.findMany({
    where: {
      active: true,
      deletedAt: null,
      reminderMinutes: { not: null, gt: 0 },
      startTime: { gt: now.toDate() },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      allDay: true,
      location: true,
      content: true,
      reminderMinutes: true,
      lecturerId: true,
    },
  })

  const thongBaos: ThongBaoJobInput[] = []

  for (const lich of danhSachLich) {
    const reminderMinutes = lich.reminderMinutes
    if (!reminderMinutes) continue

    const batDau = dayjs(lich.startTime).tz(TZ)
    if (!trongCuaSoNhac(now, batDau, reminderMinutes)) continue

    thongBaos.push({
      lecturerId: lich.lecturerId,
      type: "INDIVIDUAL_SCHEDULE",
      title: `Nhắc lịch: ${lich.title}`,
      content: taoNoiDung(lich, batDau, reminderMinutes),
      expiresAt: batDau.toDate(),
      priority: reminderMinutes <= 15 ? "HIGH" : "NORMAL",
      code: maThongBaoCron(lich.id, lich.lecturerId, batDau),
    })
  }

  const soLuong = await taoThongBaoCoMa(prisma, thongBaos)
  return { daQuet: thongBaos.length, daTao: soLuong }
}

export { quetVaThongBaoLichCaNhan }
