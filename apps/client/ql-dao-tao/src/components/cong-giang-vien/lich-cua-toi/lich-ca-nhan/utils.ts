import type { NhomLoaiLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import type { Prisma } from "@workspace/db"
import dayjs, { type Dayjs } from "dayjs"

type LichVoiTag = Prisma.IndividualScheduleGetPayload<{
  include: { tags: { select: { id: true; name: true; color: true } } }
}>

export const MAU_LOAI_LICH_MAC_DINH = ["#16a34a", "#2563eb", "#ea580c", "#9333ea", "#dc2626"]

export const mapTenTagSangNhom = (ten: string): NhomLoaiLichCaNhan => {
  const chuan = ten.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  if (chuan.includes("hop") || chuan.includes("meeting")) return "cuoc-hop"
  if (chuan.includes("ca nhan") || chuan.includes("personal")) return "ca-nhan"
  if (chuan.includes("giang") || chuan.includes("day")) return "giang-day"
  return "cong-viec"
}

export const tinhBienDong = (homNay: number, homQua: number): string => {
  const delta = homNay - homQua
  if (delta === 0) return "Không đổi"
  const dau = delta > 0 ? "+" : ""
  return `${dau}${delta} so với hôm qua`
}

export const mapLichSangDong = (lich: LichVoiTag) => {
  const tag = lich.tags[0]
  const batDau = dayjs(lich.startTime)
  const ketThuc = dayjs(lich.endTime)

  return {
    id: lich.id,
    thoiGianBatDau: lich.allDay ? "Cả ngày" : batDau.format("HH:mm"),
    thoiGianKetThuc: lich.allDay ? "" : ketThuc.format("HH:mm"),
    tiet: "—",
    tieuDe: lich.title,
    nhomLoai: tag ? mapTenTagSangNhom(tag.name) : ("cong-viec" as NhomLoaiLichCaNhan),
    tenLoai: tag?.name ?? "—",
    mauLoai: tag?.color ?? undefined,
    diaDiem: lich.location?.trim() || "—",
    noiDung: lich.description?.trim() || "—",
    ghiChu: "—",
  }
}

export type GiaTriFormLichCaNhan = {
  title: string
  tagId: string
  tuNgay: Dayjs
  denNgay: Dayjs
  caNgay: boolean
  tuGio: Dayjs
  denGio: Dayjs
  diaDiem?: string
  noiDung?: string
}

export const taoThoiGianLich = (giaTri: GiaTriFormLichCaNhan) => {
  const tuNgay = giaTri.tuNgay.startOf("day")
  const denNgay = giaTri.denNgay.startOf("day")

  if (giaTri.caNgay) {
    return {
      startTime: tuNgay.toDate(),
      endTime: denNgay.endOf("day").toDate(),
      allDay: true,
    }
  }

  const startTime = tuNgay
    .hour(giaTri.tuGio.hour())
    .minute(giaTri.tuGio.minute())
    .second(0)
    .millisecond(0)
    .toDate()

  const endTime = denNgay
    .hour(giaTri.denGio.hour())
    .minute(giaTri.denGio.minute())
    .second(0)
    .millisecond(0)
    .toDate()

  return { startTime, endTime, allDay: false }
}

export const khoangNgayQuery = (ngay: Dayjs) => ({
  startTime: { lt: ngay.endOf("day").toDate() },
  endTime: { gt: ngay.startOf("day").toDate() },
})
