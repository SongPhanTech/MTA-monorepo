import katex from "katex"
import "katex/dist/katex.min.css"
import "./index.css"

export const renderWithMath = (html: string) => {
  if (!html) return html

  const mathProcessedHtml = html
    // Handle block math first
    .replace(/\$\$([^$]+?)\$\$/g, (_, tex) => {
      return `<div class="math-display">${tex.trim()}</div>`
    })
    // Then handle inline math
    .replace(/\$([^$\n]+?)\$/g, (_, tex) => {
      return `<span class="math-inline">${tex.trim()}</span>`
    })

  // Tạo DOM ảo để xử lý
  const parser = new DOMParser()
  const doc = parser.parseFromString(mathProcessedHtml, "text/html")

  // Tìm tất cả các thẻ span có class math hoặc math-inline
  const inlineMathElements = doc.querySelectorAll("span.math-inline")
  inlineMathElements.forEach((element) => {
    try {
      const tex = element.textContent || ""
      const rendered = katex.renderToString(tex, {
        throwOnError: false,
        displayMode: false,
      })
      element.innerHTML = rendered
    } catch (error) {
      console.error("Lỗi render công thức toán inline:", error)
      element.classList.add("math-error")
    }
  })

  // Xử lý công thức dạng block (div)
  const blockMathElements = doc.querySelectorAll("div.math-display")
  blockMathElements.forEach((element) => {
    try {
      const tex = element.textContent || ""
      const rendered = katex.renderToString(tex, {
        throwOnError: false,
        displayMode: true,
      })
      element.innerHTML = rendered
    } catch (error) {
      console.error("Lỗi render công thức toán block:", error)
      element.classList.add("math-error")
    }
  })

  return doc.body.innerHTML
}
