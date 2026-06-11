import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

export const formatNhanTuan = (ngayChon: Dayjs) => {
  const dau = ngayChon.startOf("isoWeek")
  const cuoi = ngayChon.endOf("isoWeek")
  return `${dau.format("DD/MM/YYYY")} - ${cuoi.format("DD/MM/YYYY")}`
}
