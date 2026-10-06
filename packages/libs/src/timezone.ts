import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

/** Múi giờ chuẩn toàn hệ thống MTA */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh"

let timezoneInitialized = false
let printMonthFormatInstalled = false

/** Tháng trên mẫu in: 01, 02, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12. */
export const formatThangIn = (month: number) =>
  month <= 2 ? String(month).padStart(2, "0") : String(month)

/**
 * Đổi token tháng số (M, MM) trong chuỗi format sang tháng in.
 * Giữ MMM/MMMM (tên tháng) và literal trong ngoặc vuông.
 */
export const withPrintMonth = (format: string, month: number) => {
  const printed = formatThangIn(month)
  return format
    .replace(/MMMM/g, "\u0000LONG\u0000")
    .replace(/MMM/g, "\u0000MED\u0000")
    .replace(/MM/g, `[${printed}]`)
    .replace(/M/g, `[${printed}]`)
    .replace(/\u0000LONG\u0000/g, "MMMM")
    .replace(/\u0000MED\u0000/g, "MMM")
}

/** Mọi dayjs.format có dấu / và token tháng số đều ra 01, 02, 3…12. */
const installPrintMonthFormat = () => {
  if (printMonthFormatInstalled) return
  const proto = dayjs.prototype as { format: (formatStr?: string) => string }
  const original = proto.format
  proto.format = function (this: dayjs.Dayjs, formatStr?: string) {
    if (formatStr?.includes("/") && /M/.test(formatStr)) {
      return original.call(this, withPrintMonth(formatStr, this.month() + 1))
    }
    return original.call(this, formatStr)
  }
  printMonthFormatInstalled = true
}

/**
 * Khởi tạo dayjs với UTC + timezone, mặc định Asia/Ho_Chi_Minh.
 * Gọi một lần ở entrypoint FE (`_app.tsx`) và BE (`index.ts`).
 * Idempotent — gọi nhiều lần an toàn.
 */
export const setupAppTimezone = () => {
  if (timezoneInitialized) return dayjs
  dayjs.extend(utc)
  dayjs.extend(timezone)
  dayjs.extend(customParseFormat)
  dayjs.tz.setDefault(APP_TIMEZONE)
  installPrintMonthFormat()
  timezoneInitialized = true
  return dayjs
}

type DateInput = Date | dayjs.Dayjs | string | number | null | undefined

const toVn = (value: DateInput) => {
  setupAppTimezone()
  if (value == null || value === "") return null
  const d = dayjs(value)
  if (!d.isValid()) return null
  return d.tz(APP_TIMEZONE)
}

/** Dayjs theo giờ VN — dùng cho DatePicker / so sánh ngày */
export const toVnDayjs = (value: DateInput) => toVn(value)

/** Format ngày giờ theo giờ Việt Nam (mặc định DD/MM/YYYY HH:mm) */
export const formatDateTimeVn = (value: DateInput, format = "DD/MM/YYYY HH:mm") => {
  const d = toVn(value)
  return d ? d.format(format) : ""
}

/** Ngày trên mẫu in: luôn 2 chữ số (01, 02, … 09, 10, …). */
export const formatNgayIn = (day: number) => String(day).padStart(2, "0")

/** Ngày/tháng/năm trên mẫu in, dạng 01/02/2026 hoặc 01/3/2026. */
export const formatDateInSlash = (value: DateInput) => {
  const d = toVn(value)
  if (!d) return ""
  return `${formatNgayIn(d.date())}/${formatThangIn(d.month() + 1)}/${d.year()}`
}

/** Tháng/năm trên mẫu in, dạng 02/2026 hoặc 3/2026. */
export const formatThangNamIn = (value: DateInput) => {
  const d = toVn(value)
  if (!d) return ""
  return `${formatThangIn(d.month() + 1)}/${d.year()}`
}

/** Dạng "ngày 01 tháng 02 năm 2026". */
export const formatNgayThangNamIn = (value: DateInput) => {
  const d = toVn(value)
  if (!d) return ""
  return `ngày ${formatNgayIn(d.date())} tháng ${formatThangIn(d.month() + 1)} năm ${d.year()}`
}

/** Giờ in kèm ngày, dạng 09:19:49 01/02/2026. */
export const formatDateTimeIn = (value: DateInput) => {
  const d = toVn(value)
  if (!d) return ""
  return `${d.format("HH:mm:ss")} ${formatDateInSlash(d)}`
}

/**
 * Format chỉ ngày theo giờ Việt Nam, dùng cho file xuất.
 * Ngày 2 chữ số, tháng 01, 02 rồi 3–12.
 * DD/MM/YYYY và MM/YYYY cũng dùng tháng in này.
 */
export const formatDateVn = (value: DateInput, format = "DD/M/YYYY") => {
  if (format === "DD/M/YYYY" || format === "DD/MM/YYYY") return formatDateInSlash(value)
  if (format === "MM/YYYY" || format === "M/YYYY") return formatThangNamIn(value)
  return formatDateTimeVn(value, format)
}

/**
 * Parse chuỗi ngày (VD: DD/MM/YYYY từ filter bảng) thành đầu ngày theo giờ VN.
 */
export const parseVnDateStart = (value: string, format = "DD/MM/YYYY"): Date | null => {
  setupAppTimezone()
  if (!value) return null
  const d = dayjs.tz(value, format, APP_TIMEZONE)
  return d.isValid() ? d.startOf("day").toDate() : null
}

/**
 * Parse chuỗi ngày thành cuối ngày theo giờ VN.
 */
export const parseVnDateEnd = (value: string, format = "DD/MM/YYYY"): Date | null => {
  setupAppTimezone()
  if (!value) return null
  const d = dayjs.tz(value, format, APP_TIMEZONE)
  return d.isValid() ? d.endOf("day").toDate() : null
}

/**
 * Chuyển giá trị DatePicker (thường chỉ ngày) thành Date đầu ngày theo giờ VN.
 * Dùng khi lưu hạn bắt đầu nhập điểm, ngày cấp, v.v.
 */
export const toVnStartOfDay = (value: DateInput): Date | null => {
  const d = toVn(value)
  return d ? d.startOf("day").toDate() : null
}

/**
 * Chuyển giá trị DatePicker thành Date cuối ngày theo giờ VN.
 * Dùng khi lưu hạn kết thúc nhập điểm (để cả ngày vẫn còn hạn).
 */
export const toVnEndOfDay = (value: DateInput): Date | null => {
  const d = toVn(value)
  return d ? d.endOf("day").toDate() : null
}

/** Thời điểm hiện tại theo giờ Việt Nam */
export const nowVn = () => {
  setupAppTimezone()
  return dayjs().tz(APP_TIMEZONE)
}
