// Kiểu dữ liệu + helper dùng cho trang "Danh sách lớp trợ giảng" (cổng giảng viên).

import type { SubjectClassTime } from "@workspace/db"
import { PERIOD } from "@workspace/ui"
import dayjs from "dayjs"

export type TrangThaiTroGiang = "dang_dien_ra" | "sap_bat_dau" | "chua_bat_dau"

export const TRANG_THAI_TRO_GIANG_META: Record<
  TrangThaiTroGiang,
  { label: string; color: string }
> = {
  dang_dien_ra: { label: "Đang diễn ra", color: "green" },
  sap_bat_dau: { label: "Sắp bắt đầu", color: "orange" },
  chua_bat_dau: { label: "Chưa bắt đầu", color: "default" },
}

/** Bộ lọc của trang (trạng thái "tat_ca" = không lọc). */
export interface BoLocLopTroGiang {
  tuKhoa: string
  trangThai: TrangThaiTroGiang | "tat_ca"
}

/** Dòng dữ liệu cho bảng Lớp trợ giảng. */
export interface LopTroGiangRow {
  id: string
  subjectVersionId: string
  maHocPhan: string
  tenHocPhan: string
  giangVienPhuTrach: string
  soSinhVien: number
  soTietTKB: number | null
  thoiKhoaBieu: string
  trangThai: TrangThaiTroGiang
}

/** Tính trạng thái lớp theo ngày bắt đầu / kết thúc. */
export const tinhTrangThaiTroGiang = (
  start?: Date | string | null,
  end?: Date | string | null
): TrangThaiTroGiang => {
  if (!start) return "chua_bat_dau"
  const now = dayjs()
  if (now.isBefore(dayjs(start))) return "sap_bat_dau"
  if (end && now.isAfter(dayjs(end))) return "chua_bat_dau"
  return "dang_dien_ra"
}

const TEN_THU = (dayOfWeek: number) => (dayOfWeek === 8 ? "CN" : `Thứ ${dayOfWeek}`)

const layGioTiet = (period: number, loai: "startTime" | "endTime") => {
  const moc = PERIOD[period as keyof typeof PERIOD]
  return moc ? moc[loai].format("HH:mm") : null
}

/** Build chuỗi hiển thị thời khóa biểu, ví dụ "Thứ 3 - Tiết 3-4 (09:45 - 11:20)". */
export const formatThoiKhoaBieu = (
  times: Pick<SubjectClassTime, "dayOfWeek" | "startPeriod" | "endPeriod">[]
): string => {
  const dong = times.map((t) => {
    const thu = TEN_THU(t.dayOfWeek)
    const tiet = `Tiết ${t.startPeriod}-${t.endPeriod}`
    const gioBatDau = layGioTiet(t.startPeriod, "startTime")
    const gioKetThuc = layGioTiet(t.endPeriod, "endTime")
    const gio = gioBatDau && gioKetThuc ? ` (${gioBatDau} - ${gioKetThuc})` : ""
    return `${thu} - ${tiet}${gio}`
  })
  // Lịch giống nhau (cùng thứ/tiết) thì chỉ hiện 1 dòng.
  return [...new Set(dong)].join("\n")
}
