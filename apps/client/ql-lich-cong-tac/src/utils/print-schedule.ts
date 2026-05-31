export function printScheduleCard(cardClassName = "week-schedule-card") {
  const card = document.querySelector(`.${cardClassName}`)
  if (!card) {
    window.print()
    return
  }

  document.body.classList.add("printing-schedule")
  window.print()
  window.setTimeout(() => {
    document.body.classList.remove("printing-schedule")
  }, 500)
}
