import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

/** Múi giờ chuẩn toàn hệ thống MTA */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh"

let timezoneInitialized = false

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

/** Format chỉ ngày theo giờ Việt Nam. Ngày giữ số 0, tháng không có số 0. Dùng cho file xuất. */
export const formatDateVn = (value: DateInput, format = "DD/M/YYYY") => {
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
