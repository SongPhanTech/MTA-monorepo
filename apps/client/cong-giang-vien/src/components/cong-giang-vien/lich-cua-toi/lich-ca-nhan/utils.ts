import type {
  DongLichCaNhan,
  DongLichBangThang,
  NhomLoaiLichCaNhan,
  NhomNgayLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  TUY_CHON_LAP_LAI,
  TUY_CHON_NHAC_LICH,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import type { Prisma } from "@workspace/db"
import { ScheduleRepeatType } from "@workspace/db/client"
import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

const TEN_THU = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const

type LichVoiTag = Prisma.IndividualScheduleGetPayload<{
  include: { tags: { select: { id: true; name: true; color: true } } }
}>

/** Màu dự phòng khi tag API chưa có color. */
export const MAU_LOAI_MAC_DINH = "#9ca3af"

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

export const formatNhanThang = (ngayChon: Dayjs) => `Tháng ${ngayChon.format("M, YYYY")}`

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
    batDauIso: batDau.toISOString(),
    ketThucIso: ketThuc.toISOString(),
    tieuDe: lich.title,
    nhomLoai: tag ? mapTenTagSangNhom(tag.name) : ("cong-viec" as NhomLoaiLichCaNhan),
    tenLoai: tag?.name ?? "—",
    mauLoai: tag?.color ?? undefined,
    diaDiem: lich.location?.trim() || "—",
    noiDung: lich.content?.trim() || "—",
    ghiChu: "—",
    daHoanThanh: lich.isCompleted,
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

export const CHON_NGUOI_LIEN_QUAN = {
  id: true,
  fullname: true,
  email: true,
  code: true,
  lecturer: {
    select: {
      lectureID: true,
      organization: { select: { sMa: true, sCode: true } },
    },
  },
  educationAndTraining: {
    take: 1,
    select: {
      registerNumber: true,
      fixedClass: {
        select: {
          managementOrganization: { select: { sMa: true, sCode: true } },
        },
      },
    },
  },
} as const

export const taoDieuKienTimNguoiLienQuan = (tuKhoa: string) => ({
  OR: [
    { fullname: { contains: tuKhoa, mode: "insensitive" as const } },
    { email: { contains: tuKhoa, mode: "insensitive" as const } },
    { phoneNumber: { contains: tuKhoa, mode: "insensitive" as const } },
    { code: { contains: tuKhoa, mode: "insensitive" as const } },
    {
      lecturer: {
        lectureID: { contains: tuKhoa, mode: "insensitive" as const },
      },
    },
    {
      lecturer: {
        organization: {
          OR: [
            { sMa: { contains: tuKhoa, mode: "insensitive" as const } },
            { sCode: { contains: tuKhoa, mode: "insensitive" as const } },
          ],
        },
      },
    },
    {
      educationAndTraining: {
        some: {
          registerNumber: { contains: tuKhoa, mode: "insensitive" as const },
        },
      },
    },
    {
      educationAndTraining: {
        some: {
          fixedClass: {
            managementOrganization: {
              OR: [
                { sMa: { contains: tuKhoa, mode: "insensitive" as const } },
                { sCode: { contains: tuKhoa, mode: "insensitive" as const } },
              ],
            },
          },
        },
      },
    },
  ],
})

export type NguoiLienQuanTomTat = {
  id: string
  fullname?: string | null
  email?: string | null
  code?: string | null
  lecturer?: {
    lectureID?: string | null
    organization?: { sMa?: string | null; sCode?: string | null } | null
  } | null
  educationAndTraining?: Array<{
    registerNumber?: string | null
    fixedClass?: {
      managementOrganization?: { sMa?: string | null; sCode?: string | null } | null
    } | null
  }>
}

export type TuyChonNguoiLienQuan = {
  value: string
  label: string
  ten: string
  ma?: string
  maDonVi?: string
}

export const layMaNguoiLienQuan = (nguoi: NguoiLienQuanTomTat) => {
  const maGv = nguoi.lecturer?.lectureID?.trim()
  if (maGv) return maGv

  const hocVien = nguoi.educationAndTraining?.[0]
  return nguoi.code?.trim() || hocVien?.registerNumber?.trim() || ""
}

export const layMaDonViNguoiLienQuan = (nguoi: NguoiLienQuanTomTat) => {
  const donViGv = nguoi.lecturer?.organization
  if (donViGv) {
    return donViGv.sMa?.trim() || donViGv.sCode?.trim() || ""
  }

  const donViSv = nguoi.educationAndTraining?.[0]?.fixedClass?.managementOrganization
  if (donViSv) {
    return donViSv.sMa?.trim() || donViSv.sCode?.trim() || ""
  }

  return ""
}

export const taoNhanNguoiLienQuan = (nguoi: NguoiLienQuanTomTat) => {
  const ten = nguoi.fullname?.trim() || nguoi.email?.trim() || nguoi.id
  const ma = layMaNguoiLienQuan(nguoi)
  const maDonVi = layMaDonViNguoiLienQuan(nguoi)

  return [ma, ten, maDonVi].filter(Boolean).join(" - ")
}

const phanTachHoTenVietNam = (hoTen: string) => {
  const parts = hoTen.trim().split(/\s+/).filter(Boolean)
  return {
    ten: parts.pop() ?? "",
    ho: parts.shift() ?? "",
  }
}

/** Sắp xếp theo tên → họ */
export const soSanhHoTenVietNam = (a: string, b: string) => {
  const nameA = phanTachHoTenVietNam(a)
  const nameB = phanTachHoTenVietNam(b)
  return nameA.ten.localeCompare(nameB.ten, "vi") || nameA.ho.localeCompare(nameB.ho, "vi")
}

export const taoTuyChonNguoiLienQuan = (nguoi: NguoiLienQuanTomTat): TuyChonNguoiLienQuan => {
  const ten = nguoi.fullname?.trim() || nguoi.email?.trim() || nguoi.id
  const ma = layMaNguoiLienQuan(nguoi)
  const maDonVi = layMaDonViNguoiLienQuan(nguoi)

  return {
    value: nguoi.id,
    ten,
    ma: ma || undefined,
    maDonVi: maDonVi || undefined,
    label: taoNhanNguoiLienQuan(nguoi),
  }
}

export const chuyenNhacLichSangPhut = (nhacLich?: string | null): number | null => {
  if (!nhacLich || nhacLich === "none") return null
  const phut = Number(nhacLich)
  return Number.isFinite(phut) ? phut : null
}

export const chuyenPhutSangNhacLich = (phut?: number | null): string =>
  phut == null ? "none" : String(phut)

export const layNhanNhacLich = (phut?: number | null) => {
  if (phut == null) return "Không nhắc"
  const tuyChon = TUY_CHON_NHAC_LICH.find((item) => item.value === String(phut))
  return tuyChon?.label ?? `Trước ${phut} phút`
}

export const layNhanNhacLichChiTiet = (phut?: number | null) => {
  if (phut == null) return "Không nhắc"
  if (phut >= 1440 && phut % 1440 === 0) {
    const ngay = phut / 1440
    return `${ngay} ngày trước sự kiện`
  }
  if (phut >= 60 && phut % 60 === 0) {
    const gio = phut / 60
    return `${gio} giờ trước sự kiện`
  }
  return `${phut} phút trước sự kiện`
}

export const layNhanLapLai = (repeatType?: ScheduleRepeatType | null) => {
  const tuyChon = TUY_CHON_LAP_LAI.find((item) => item.value === (repeatType ?? "NONE"))
  if ((repeatType ?? "NONE") === "NONE") return "Không lặp"
  return tuyChon?.label ?? "Không lặp"
}

export const formatGioChiTietLich = (
  startTime: string | Date,
  endTime: string | Date,
  allDay: boolean
) => {
  const batDau = dayjs(startTime)
  const ketThuc = dayjs(endTime)
  const nhanNgay = `${TEN_THU[batDau.day()]}, ${batDau.format("DD/MM/YYYY")}`

  if (allDay) {
    return { gio: "Cả ngày", ngay: nhanNgay }
  }

  return {
    gio: `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")}`,
    ngay: nhanNgay,
  }
}

export const formatThoiGianChiTietLich = (
  startTime: string | Date,
  endTime: string | Date,
  allDay: boolean
) => {
  const batDau = dayjs(startTime)
  const ketThuc = dayjs(endTime)
  const nhanNgay = `${TEN_THU[batDau.day()]}, ${batDau.format("DD/MM/YYYY")}`

  if (allDay) return `Cả ngày · ${nhanNgay}`

  return `${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")} · ${nhanNgay}`
}

export const layChuCaiVietTat = (ten: string) => {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  if (tu.length === 0) return "?"
  if (tu.length === 1) return tu[0].slice(0, 2).toUpperCase()
  return `${tu[0][0] ?? ""}${tu[tu.length - 1][0] ?? ""}`.toUpperCase()
}

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

/** Hai khoảng thời gian giao nhau khi lịch này chưa kết thúc thì lịch kia đã bắt đầu. */
export const lichCoGiaoNhau = (
  batDau: Date | string | Dayjs,
  ketThuc: Date | string | Dayjs,
  lichKhacBatDau: Date | string | Dayjs,
  lichKhacKetThuc: Date | string | Dayjs
) => dayjs(batDau).isBefore(dayjs(lichKhacKetThuc)) && dayjs(ketThuc).isAfter(dayjs(lichKhacBatDau))

export const taoDieuKienTimLichGiaoNhau = (
  lecturerId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
) => ({
  lecturerId,
  active: true,
  ...(excludeId ? { id: { not: excludeId } } : {}),
  startTime: { lt: endTime },
  endTime: { gt: startTime },
})

export const taoThongBaoLichGiaoNhau = (lich: {
  title: string
  startTime: string | Date
  endTime: string | Date
  allDay: boolean
}) => {
  const { gio, ngay } = formatGioChiTietLich(lich.startTime, lich.endTime, lich.allDay)
  const thoiGian = lich.allDay ? ngay : `${gio}, ${ngay}`
  return `Lịch bị trùng với "${lich.title}" (${thoiGian})`
}
