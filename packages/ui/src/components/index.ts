import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import isBetween from "dayjs/plugin/isBetween"
import isLeapYear from "dayjs/plugin/isLeapYear"
import isoWeeksInYear from "dayjs/plugin/isoWeeksInYear"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import LocalizedFormat from "dayjs/plugin/localizedFormat"
import minMax from "dayjs/plugin/minMax"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import relativeTime from "dayjs/plugin/relativeTime"
import weekOfYear from "dayjs/plugin/weekOfYear"
import "dayjs/locale/vi"
dayjs.extend(minMax)
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(LocalizedFormat)
dayjs.extend(quarterOfYear)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekOfYear)
dayjs.extend(isoWeeksInYear)
dayjs.extend(isLeapYear)
dayjs.extend(quarterOfYear)
dayjs.extend(isBetween)
dayjs.locale("vi")
export { dayjs }
export * from "./commons"
export * from "./cong-giang-vien"
export * from "./icon"
export * from "./lich-tuan"
export * from "./search-system"
export * from "./select-fixed-class"
export * from "./select-semester"
export * from "./select-training-course"
export * from "./select-training-major"
export * from "./select-training-object-type"
export * from "./thong-bao"
export * from "./thong-ke"
export * from "./xem-tai-lieu"
