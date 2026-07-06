import type {
  DongLichBangTheoNgayGiangDay,
  DongLichGiangDay,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import type { Prisma } from "@workspace/db"
import { PERIOD } from "@workspace/ui"
import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

export type LichGiangDayRaw = Prisma.ClassScheduleGetPayload<{
  include: {
    subjectClass: {
      select: {
        id: true
        code: true
        name: true
        subject: { select: { name: true; code: true } }
        trainingLocation: { select: { name: true } }
        room: { select: { name: true } }
      }
    }
    room: {
      select: {
        name: true
        building: { select: { trainingLocation: { select: { name: true } } } }
      }
    }
  }
}>

const TEN_THU = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const

export const formatNgayChonHienThi = (ngay: Dayjs) =>
  `${TEN_THU[ngay.day()]}, ${ngay.format("DD/MM/YYYY")}`

export const formatNhanNgayTuan = (ngay: Dayjs) => {
  const thu = ngay.format("dddd")
  return `${thu.charAt(0).toUpperCase()}${thu.slice(1)} ${ngay.format("DD/MM")}`
}

export const taoNgayTrongTuan = (dauTuan: Dayjs) =>
  Array.from({ length: 7 }, (_, i) => dauTuan.add(i, "day"))

export const layTenHocPhan = (hocPhan: string) => {
  const idx = hocPhan.indexOf(" - ")
  return idx >= 0 ? hocPhan.slice(idx + 3) : hocPhan
}

export const khoangNgayQuery = (ngay: Dayjs) => ({
  classDate: {
    gte: ngay.startOf("day").toDate(),
    lte: ngay.endOf("day").toDate(),
  },
})

export const layKhoangTuan = (ngayChon: Dayjs) => ({
  dauTuan: ngayChon.startOf("isoWeek"),
  cuoiTuan: ngayChon.endOf("isoWeek"),
})

export const khoangTuanQuery = (dauTuan: Dayjs, cuoiTuan: Dayjs) => ({
  classDate: {
    gte: dauTuan.startOf("day").toDate(),
    lte: cuoiTuan.endOf("day").toDate(),
  },
})

export const formatThu = (ngayKey: string) => TEN_THU[dayjs(ngayKey).day()]

export const formatNgayBang = (ngayKey: string) => dayjs(ngayKey).format("DD/MM/YYYY")

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

export const locSuKienTrongThang = (danhSach: DongLichGiangDay[], thangXem: Dayjs) =>
  danhSach.filter((e) => dayjs(e.ngayKey).isSame(thangXem, "month"))

/** Màu mặc định cho sự kiện lịch giảng dạy (không có trường màu trên DB). */
export const MAU_SU_KIEN_LICH_GIANG_DAY = "#2563eb"

export const layMaHienThiLichGiangDay = (suKien: DongLichGiangDay) => {
  if (suKien.lopHocPhan && suKien.lopHocPhan !== "—") {
    return suKien.lopHocPhan.split(".")[0] ?? suKien.lopHocPhan
  }
  const ma = suKien.hocPhan.split(" - ")[0]
  return ma && ma !== "—" ? ma : suKien.hocPhan
}

export const khoangThangQuery = (dauThang: Dayjs, cuoiThang: Dayjs) => ({
  classDate: {
    gte: dauThang.startOf("day").toDate(),
    lte: cuoiThang.endOf("day").toDate(),
  },
})

export const formatNhanThang = (ngayChon: Dayjs) => `Tháng ${ngayChon.format("M, YYYY")}`

export const layDanhSachNgayCoLich = (danhSach: DongLichGiangDay[]) => {
  const keys = new Set<string>()
  for (const item of danhSach) keys.add(item.ngayKey)
  return Array.from(keys).sort()
}

export const timTrangChuaNgay = (ngayCoLich: string[], ngayKey: string, soNgayTrang: number) => {
  const idx = ngayCoLich.indexOf(ngayKey)
  if (idx < 0) return 1
  return Math.floor(idx / soNgayTrang) + 1
}

export const chuyenSangDongBangTheoNgay = (
  danhSach: DongLichGiangDay[]
): DongLichBangTheoNgayGiangDay[] => {
  const rows: DongLichBangTheoNgayGiangDay[] = []
  let i = 0

  while (i < danhSach.length) {
    const ngayKey = danhSach[i].ngayKey
    const suKienNgay: DongLichGiangDay[] = []

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

/** @deprecated Dùng chuyenSangDongBangTheoNgay */
export const chuyenSangDongBangTuan = chuyenSangDongBangTheoNgay

export const mapLichGiangDaySangDong = (lich: LichGiangDayRaw): DongLichGiangDay => {
  const startPeriod = PERIOD[lich.startPeriod as keyof typeof PERIOD]
  const endPeriod = PERIOD[lich.endPeriod as keyof typeof PERIOD]

  const batDau = lich.startTime
    ? dayjs(lich.startTime)
    : dayjs(lich.classDate)
        .hour(dayjs(startPeriod?.startTime).hour())
        .minute(dayjs(startPeriod?.startTime).minute())

  const ketThuc = lich.endTime
    ? dayjs(lich.endTime)
    : dayjs(lich.classDate)
        .hour(dayjs(endPeriod?.endTime).hour())
        .minute(dayjs(endPeriod?.endTime).minute())

  const maMon = lich.subjectClass?.subject?.code ?? lich.subjectClass?.code ?? ""
  const tenMon = lich.subjectClass?.subject?.name ?? lich.subjectClass?.name ?? lich.notes ?? ""
  const hocPhan = maMon && tenMon ? `${maMon} - ${tenMon}` : tenMon || maMon || "—"

  const phongHoc = lich.room?.name ?? lich.subjectClass?.room?.name ?? "—"
  const khuVuc =
    lich.subjectClass?.trainingLocation?.name ?? lich.room?.building?.trainingLocation?.name ?? "—"

  return {
    id: lich.id,
    ngayKey: dayjs(lich.classDate).format("YYYY-MM-DD"),
    thoiGianBatDau: batDau.format("HH:mm"),
    thoiGianKetThuc: ketThuc.format("HH:mm"),
    tiet: `${lich.startPeriod} - ${lich.endPeriod}`,
    batDauIso: batDau.toISOString(),
    ketThucIso: ketThuc.toISOString(),
    hocPhan,
    lopHocPhan: lich.subjectClass?.code ?? "—",
    khuVuc,
    phongHoc,
    ghiChu: lich.notes?.trim() || "—",
    soTiet: Math.max(1, lich.endPeriod - lich.startPeriod + 1),
    periodType: lich.periodType,
    subjectClassId: lich.subjectClass?.id ?? null,
    phongKey: phongHoc,
  }
}

export const mapLichGiangDaySangSuKien = (lich: LichGiangDayRaw): SuKienLich => {
  const dong = mapLichGiangDaySangDong(lich)
  const batDauIso = dayjs(lich.classDate)
    .hour(dayjs(dong.thoiGianBatDau, "HH:mm").hour())
    .minute(dayjs(dong.thoiGianBatDau, "HH:mm").minute())
  const ketThucIso = dayjs(lich.classDate)
    .hour(dayjs(dong.thoiGianKetThuc, "HH:mm").hour())
    .minute(dayjs(dong.thoiGianKetThuc, "HH:mm").minute())

  return {
    id: `gd-${lich.id}`,
    idGoc: lich.id,
    nguon: "giang-day",
    ngay: dayjs(lich.classDate).format("YYYY-MM-DD"),
    tieuDe: dong.hocPhan,
    tiet: `${lich.startPeriod} - ${lich.endPeriod}`,
    thoiGian: `${dong.thoiGianBatDau} - ${dong.thoiGianKetThuc}`,
    thoiGianBatDau: batDauIso.toISOString(),
    thoiGianKetThuc: ketThucIso.toISOString(),
    loaiLich: lich.periodType,
    tenLoai: "Giảng dạy",
    mauLoai: MAU_SU_KIEN_LICH_GIANG_DAY,
    diaDiem: dong.phongHoc !== "—" ? dong.phongHoc : dong.khuVuc,
    ghiChu: dong.ghiChu !== "—" ? dong.ghiChu : undefined,
  }
}

export const tinhThongKeLichGiangDay = (danhSach: DongLichGiangDay[]) => {
  const lopIds = new Set<string>()
  const phong = new Set<string>()

  for (const item of danhSach) {
    if (item.subjectClassId) lopIds.add(item.subjectClassId)
    if (item.phongKey && item.phongKey !== "—") phong.add(item.phongKey)
  }

  return {
    tongTiet: danhSach.reduce((sum, item) => sum + item.soTiet, 0),
    soLopHocPhan: lopIds.size,
    soPhongHoc: phong.size,
  }
}

export const CHON_CHI_TIET_LICH_GIANG_DAY = {
  id: true,
  classDate: true,
  startTime: true,
  endTime: true,
  startPeriod: true,
  endPeriod: true,
  notes: true,
  subjectClass: {
    select: {
      id: true,
      code: true,
      name: true,
      subjectClassStudent: { select: { id: true } },
      subject: {
        select: {
          name: true,
          code: true,
          managementOrganization: { select: { sTen: true } },
        },
      },
      trainingObjectType: {
        select: {
          trainingForm: { select: { name: true } },
        },
      },
      mainLecturer: {
        select: {
          code: true,
          userProfile: {
            select: {
              fullname: true,
              academicRankType: { select: { sMa: true } },
              academicDegreeType: { select: { sMa: true } },
            },
          },
        },
      },
    },
  },
  lecturer: {
    select: {
      code: true,
      userProfile: {
        select: {
          fullname: true,
          academicRankType: { select: { sMa: true } },
          academicDegreeType: { select: { sMa: true } },
        },
      },
    },
  },
  extraLecturer: {
    select: {
      code: true,
      userProfile: {
        select: {
          fullname: true,
          academicRankType: { select: { sMa: true } },
          academicDegreeType: { select: { sMa: true } },
        },
      },
    },
  },
  room: { select: { name: true } },
} as const

export const formatThoiGianChiTietGiangDay = (
  classDate: Date | string,
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined,
  startPeriod: number,
  endPeriod: number
) => {
  const ngay = dayjs(classDate)
  const soTiet = Math.max(1, endPeriod - startPeriod + 1)
  const nhanNgay = `${TEN_THU[ngay.day()]}, ${ngay.format("DD/MM/YYYY")}`

  if (startTime && endTime) {
    const batDau = dayjs(startTime)
    const ketThuc = dayjs(endTime)
    return `${nhanNgay}, ${batDau.format("HH:mm")} - ${ketThuc.format("HH:mm")} (${soTiet} tiết)`
  }

  return `${nhanNgay}, Tiết ${startPeriod} - ${endPeriod} (${soTiet} tiết)`
}

export const layTenMonHocChiTietGiangDay = (lich: {
  subjectClass?: {
    name?: string | null
    subject?: { name?: string | null } | null
  } | null
}) => lich.subjectClass?.subject?.name?.trim() || lich.subjectClass?.name?.trim() || "—"
