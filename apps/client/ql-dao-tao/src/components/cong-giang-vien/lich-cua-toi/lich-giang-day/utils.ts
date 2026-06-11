import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import type { SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import type { Prisma } from "@workspace/db"
import { PERIOD } from "@workspace/ui"
import dayjs, { type Dayjs } from "dayjs"

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

export const khoangNgayQuery = (ngay: Dayjs) => ({
  classDate: {
    gte: ngay.startOf("day").toDate(),
    lte: ngay.endOf("day").toDate(),
  },
})

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
  const tenMon =
    lich.subjectClass?.subject?.name ?? lich.subjectClass?.name ?? lich.notes ?? ""
  const hocPhan =
    maMon && tenMon ? `${maMon} - ${tenMon}` : tenMon || maMon || "—"

  const phongHoc = lich.room?.name ?? lich.subjectClass?.room?.name ?? "—"
  const khuVuc =
    lich.subjectClass?.trainingLocation?.name ??
    lich.room?.building?.trainingLocation?.name ??
    "—"

  return {
    id: lich.id,
    thoiGianBatDau: batDau.format("HH:mm"),
    thoiGianKetThuc: ketThuc.format("HH:mm"),
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
    id: lich.id,
    ngay: dayjs(lich.classDate).format("YYYY-MM-DD"),
    tieuDe: dong.hocPhan,
    tiet: `${lich.startPeriod} - ${lich.endPeriod}`,
    thoiGian: `${dong.thoiGianBatDau} - ${dong.thoiGianKetThuc}`,
    thoiGianBatDau: batDauIso.toISOString(),
    thoiGianKetThuc: ketThucIso.toISOString(),
    loaiLich: lich.periodType,
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
