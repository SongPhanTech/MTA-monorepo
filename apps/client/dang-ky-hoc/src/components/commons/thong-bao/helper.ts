import dayjs from "dayjs"

const stripHtml = (html: string) => {
  return html?.replace(/<[^>]*>?/gm, "") || ""
}

const formatTime = (date: string) => {
  const d = dayjs(date)
  const now = dayjs()
  if (d.isSame(now, "day")) return `Today, ${d.format("HH:mm")}`
  if (d.isSame(now.subtract(1, "day"), "day")) return `Yesterday, ${d.format("HH:mm")}`
  return d.format("MMM DD, HH:mm")
}

const notificationHelpers = { stripHtml, formatTime }

export default notificationHelpers
