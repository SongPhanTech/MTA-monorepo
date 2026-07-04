import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

export const TIEU_DE_THU = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
] as const

/** Tiêu đề cột Thứ trên lịch tháng / header tuần */
export const CLASS_TIEU_DE_THU =
  "border-l border-cgv-green bg-cgv-green px-1 py-2 text-center text-xs font-bold text-gray-900 first:border-l-0"

/** Ô cột Thứ trong bảng (rowSpan theo ngày) */
export const CLASS_O_THU_BANG = "bg-cgv-green font-bold text-gray-900"

export const taoOnCellThu = (rowSpanThu: number) => ({
  rowSpan: rowSpanThu,
  className: rowSpanThu > 0 ? CLASS_O_THU_BANG : undefined,
})

export const formatNhanTuan = (ngayChon: Dayjs) => {
  const dau = ngayChon.startOf("isoWeek")
  const cuoi = ngayChon.endOf("isoWeek")
  return `${dau.format("DD/MM/YYYY")} - ${cuoi.format("DD/MM/YYYY")}`
}
