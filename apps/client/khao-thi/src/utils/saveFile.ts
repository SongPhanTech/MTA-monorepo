export const convertHtmlBreaks = (text: string | null | undefined): string => {
  if (!text) return ""
  return text
    .replace(/<br\s*\/?>/gi, "\n") // <br>, <br/>, <br />
    .replace(/<\/p>\s*<p>/gi, "\n\n") // </p><p> thành 2 dòng mới
    .replace(/<[^>]*>/g, "") // Xóa các HTML tag khác
    .trim()
}

export function saveFile(fileName: string, blob: Blob) {
  const blodUrl = URL.createObjectURL(blob)

  let link: HTMLAnchorElement | null = document.createElement("a")
  link.download = fileName
  link.href = blodUrl

  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    link?.remove()
    window.URL.revokeObjectURL(blodUrl)
    link = null
  }, 0)
}
