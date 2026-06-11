import type {
  DongLichCaNhan,
  DongLichBangThang,
  NhomLoaiLichCaNhan,
  NhomNgayLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import type { Prisma } from "@workspace/db"
import { ScheduleRepeatType } from "@workspace/db/client"
import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

const TEN_THU = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
] as const

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

export const tinhBienDong = (homNay: number, homQua: number, soSanh = "hôm qua"): string => {
  const delta = homNay - homQua
  if (delta === 0) return "Không đổi"
  const dau = delta > 0 ? "+" : ""
  return `${dau}${delta} so với ${soSanh}`
}

export const layKhoangTuan = (ngayChon: Dayjs) => ({
  dauTuan: ngayChon.startOf("isoWeek"),
  cuoiTuan: ngayChon.endOf("isoWeek"),
})

export const layKhoangThang = (ngayChon: Dayjs) => {
  const dauThang = ngayChon.startOf("month")
  const cuoiThang = ngayChon.endOf("month")
  return {
    dauThang,
    cuoiThang,
    dauLich: dauThang.startOf("isoWeek"),
    cuoiLich: cuoiThang.endOf("isoWeek"),
  }
}

export const taoNgayTrongLichThang = (dauLich: Dayjs, cuoiLich: Dayjs): Dayjs[] => {
  const days: Dayjs[] = []
  let cur = dauLich.startOf("day")
  const ket = cuoiLich.startOf("day")
  while (cur.isBefore(ket) || cur.isSame(ket, "day")) {
    days.push(cur)
    cur = cur.add(1, "day")
  }
  return days
}

export const locSuKienTrongThang = (danhSach: DongLichCaNhan[], thangXem: Dayjs) =>
  danhSach.filter((e) => dayjs(e.ngayKey).isSame(thangXem, "month"))

export const formatNhanThang = (ngayChon: Dayjs) =>
  `Tháng ${ngayChon.format("M, YYYY")}`

export const formatNgayChonHienThi = (ngay: Dayjs) =>
  `${TEN_THU[ngay.day()]}, ${ngay.format("DD/MM/YYYY")}`

export const formatThu = (ngayKey: string) => TEN_THU[dayjs(ngayKey).day()]

export const formatNgayBang = (ngayKey: string) => dayjs(ngayKey).format("DD/MM/YYYY")

export const chuyenSangDongBangThang = (danhSach: DongLichCaNhan[]): DongLichBangThang[] => {
  const rows: DongLichBangThang[] = []
  let i = 0

  while (i < danhSach.length) {
    const ngayKey = danhSach[i].ngayKey
    const suKienNgay: DongLichCaNhan[] = []

    while (i < danhSach.length && danhSach[i].ngayKey === ngayKey) {
      suKienNgay.push(danhSach[i])
      i++
    }

    const count = suKienNgay.length
    suKienNgay.forEach((suKien, idx) => {
      rows.push({
        ...suKien,
        thu: formatThu(suKien.ngayKey),
        ngay: formatNgayBang(suKien.ngayKey),
        rowSpanThu: idx === 0 ? count : 0,
        rowSpanNgay: idx === 0 ? count : 0,
      })
    })
  }

  return rows
}

export const formatNhanNgay = (ngay: Dayjs) =>
  `${TEN_THU[ngay.day()].toUpperCase()}, ${ngay.format("DD/MM/YYYY")}`

export const nhomLichTheoNgay = (danhSach: DongLichCaNhan[]): NhomNgayLich[] => {
  const grouped = new Map<string, DongLichCaNhan[]>()

  for (const row of danhSach) {
    const key = row.ngayKey
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(row)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, suKien]) => ({
      id: key,
      key,
      nhanNgay: formatNhanNgay(dayjs(key)),
      suKien,
    }))
}

export const mapLichSangDong = (lich: LichVoiTag) => {
  const tag = lich.tags[0]
  const batDau = dayjs(lich.startTime)
  const ketThuc = dayjs(lich.endTime)

  return {
    id: lich.id,
    ngayKey: batDau.format("YYYY-MM-DD"),
    thoiGianBatDau: lich.allDay ? "Cả ngày" : batDau.format("HH:mm"),
    thoiGianKetThuc: lich.allDay ? "" : ketThuc.format("HH:mm"),
    caNgay: lich.allDay,
    batDauIso: lich.startTime,
    ketThucIso: lich.endTime,
    tieuDe: lich.title,
    nhomLoai: tag ? mapTenTagSangNhom(tag.name) : ("cong-viec" as NhomLoaiLichCaNhan),
    tenLoai: tag?.name ?? "—",
    mauLoai: tag?.color ?? undefined,
    diaDiem: lich.location?.trim() || "—",
    noiDung: lich.content?.trim() || "—",
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
  nhacLich?: string
  lapLai: ScheduleRepeatType
  nguoiLienQuanIds?: string[]
}

export const chuyenNhacLichSangPhut = (nhacLich?: string | null): number | null => {
  if (!nhacLich || nhacLich === "none") return null
  const phut = Number(nhacLich)
  return Number.isFinite(phut) ? phut : null
}

export const chuyenPhutSangNhacLich = (phut?: number | null): string =>
  phut == null ? "none" : String(phut)

export const taoDuLieuLuuLich = (
  giaTri: GiaTriFormLichCaNhan,
  thoiGian: ReturnType<typeof taoThoiGianLich>
) => ({
  title: giaTri.title.trim(),
  ...thoiGian,
  location: giaTri.diaDiem?.trim() || null,
  content: giaTri.noiDung?.trim() || null,
  reminderMinutes: chuyenNhacLichSangPhut(giaTri.nhacLich),
  repeatType: giaTri.lapLai ?? ScheduleRepeatType.NONE,
})

export const datGioCaNgay = (tuNgay: Dayjs, denNgay: Dayjs) => ({
  tuGio: tuNgay.startOf("day").hour(0).minute(0).second(0),
  denGio: denNgay.startOf("day").hour(23).minute(59).second(0),
})

export const taoThoiGianLich = (giaTri: GiaTriFormLichCaNhan) => {
  const tuNgay = giaTri.tuNgay.startOf("day")
  const denNgay = giaTri.denNgay.startOf("day")

  if (giaTri.caNgay) {
    const { tuGio, denGio } = datGioCaNgay(tuNgay, denNgay)
    return {
      startTime: tuGio.toDate(),
      endTime: denGio.toDate(),
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

export const khoangTuanQuery = (dauTuan: Dayjs, cuoiTuan: Dayjs) => ({
  startTime: { lt: cuoiTuan.endOf("day").toDate() },
  endTime: { gt: dauTuan.startOf("day").toDate() },
})

export const khoangThangQuery = (dauThang: Dayjs, cuoiThang: Dayjs) => ({
  startTime: { lt: cuoiThang.endOf("day").toDate() },
  endTime: { gt: dauThang.startOf("day").toDate() },
})
