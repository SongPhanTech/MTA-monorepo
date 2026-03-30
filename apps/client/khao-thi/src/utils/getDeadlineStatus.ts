import dayjs from "dayjs"

export const getDeadlineStatus = (deadline: Date | string) => {
  const now = dayjs()
  const deadlineDate = dayjs(deadline)
  const daysUntilDeadline = deadlineDate.diff(now, "day")

  if (daysUntilDeadline < 0) {
    return {
      color: "red",
      text: "Quá hạn",
    }
  }
  if (daysUntilDeadline <= 3) {
    return {
      color: "orange",
      text: "Sắp quá hạn",
    }
  }

  return { color: "blue", text: "" }
}
