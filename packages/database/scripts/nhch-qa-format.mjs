/**
 * Tách đề / đáp án và xuống dòng các ý cho nội dung NHCH.
 * UI render HTML (dangerouslySetInnerHTML) nên \\n phải thành <br />.
 */

export function parsePointToken(token) {
  const m = String(token || "").match(/^(\d+[.,]?\d*)\s*(?:đ|điểm)?$/i)
  if (!m) return null
  const n = Number.parseFloat(m[1].replace(",", "."))
  if (!Number.isFinite(n) || n <= 0 || n > 10) return null
  return n
}

const ANSWER_HEADING =
  /(?:^|\n)[ \t]*\*?[ \t]*(Đáp\s*án|Trả\s*lời|Lời\s*giải|Hướng\s*dẫn\s*chấm)[ \t]*:?[ \t]*/i

/**
 * Tách khi tiêu đề đáp án đứng riêng một dòng, hoặc "Đáp án:" (có dấu :).
 * Không cắt cụm "đáp án đúng" nằm giữa câu.
 */
export function splitAnswerSection(body) {
  const text = String(body || "")
  const m = ANSWER_HEADING.exec(text)
  if (!m) return { body: text, answerText: "" }
  const heading = m[0]
  const hasColon = /:\s*$/.test(heading)
  const lineEnd = text.indexOf("\n", m.index + 1)
  const headingLine = text.slice(m.index, lineEnd === -1 ? text.length : lineEnd).trim()
  const headingOnly = /^\*?\s*(Đáp\s*án|Trả\s*lời|Lời\s*giải|Hướng\s*dẫn\s*chấm)\s*:?\s*$/i.test(
    headingLine
  )
  if (!hasColon && !headingOnly) return { body: text, answerText: "" }
  return {
    body: text.slice(0, m.index).trim(),
    answerText: text.slice(m.index + heading.length).trim(),
  }
}

function breakListItems(s) {
  return s
    .replace(/(?:^|\n)[ \t]*[•●▪‣][ \t]*/g, "\n• ")
    .replace(/[ \t]+[•●▪‣][ \t]*/g, "\n• ")
    .replace(/(?:^|\n)[ \t]*[-–—][ \t]+/g, "\n- ")
    .replace(/(?:^|\n)[ \t]*(\d{1,2})[.)][ \t]+/g, "\n$1. ")
    .replace(/(?:^|\n)[ \t]*([a-dA-D])\)[ \t]+/g, "\n$1) ")
    .replace(/([:;])[ \t]+(\d{1,2}[.)][ \t]+)/g, "$1\n$2")
    .replace(/([^\n])[ \t]+([a-dA-D]\)[ \t]+)/g, "$1\n$2")
}

export function toDisplayHtml(text) {
  if (text == null || text === "") return text
  let s = String(text)
    .replace(/\u0000/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
  s = breakListItems(s)
  s = s
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => {
      const t = l.trim()
      if (!t) return true
      if (parsePointToken(t) != null && t.length <= 8) return false
      if (/^Câu\s+\d+\s*[.:]?\s*$/i.test(t)) return false
      if (/^\*?\s*(Đáp\s*án|Trả\s*lời|Lời\s*giải)\s*:?\s*$/i.test(t)) return false
      return true
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  if (!s) return s
  s = s.replace(/\n+(\s*<img\b)/gi, " $1").replace(/(<img\b[^>]*>)\s*\n+/gi, "$1 ")
  return s.replace(/\n/g, "<br />")
}

export function looksLikeStoredGarbage(text) {
  if (!text) return false
  if (text.length > 20000) return true
  const sample = text.slice(0, 1500)
  let weird = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    if (c === 0 || (c < 9) || (c > 14 && c < 32 && c !== 10 && c !== 13)) weird++
  }
  if (weird > 6) return true
  const letters = (sample.match(/[A-Za-zÀ-ỹ]/g) || []).length
  return letters < 15 && sample.length > 80
}

function cleanStem(text) {
  return String(text || "")
    .replace(/^\s*\d+\s*:\s*\([^)\n]*\)\s*/i, "")
    .replace(/^\s*Câu hỏi\s*:\s*/i, "")
    .replace(/^\s*\d{1,4}\s*\n/, "")
    .trim()
}

/** Đáp án tự luận nằm sau một dòng điểm đứng riêng (6đ, 3,0 đ), không có tiêu đề Đáp án. */
function splitOnScoreLine(text) {
  const lines = String(text || "").split("\n")
  const idx = lines.findIndex((l, i) => i > 0 && parsePointToken(l.trim()) != null && l.trim().length <= 8)
  if (idx < 0) return null
  const before = lines.slice(0, idx).join("\n").trim()
  const after = lines.slice(idx + 1).join("\n").trim()
  if (before.length < 20 || after.length < 40) return null
  if (/^\s*Câu hỏi\s*:/i.test(after)) return null
  return { body: before, answerText: after }
}

/**
 * Trắc nghiệm bị lưu cả A–D trong nội dung đề.
 * Trả về null nếu không đủ A và B trên dòng riêng.
 */
export function extractLinedMc(text) {
  const lines = String(text || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const start = lines.findIndex((l) => /^A\.?$/.test(l) || /^A\.\s+\S/.test(l))
  if (start < 1) return null
  const options = []
  let i = start
  while (i < lines.length && options.length < 6) {
    const m = lines[i].match(/^([A-D])(?:\.\s+|\.\s*$|\s+$)(.*)$/i) || lines[i].match(/^([A-D])$/i)
    if (!m) break
    const label = m[1].toUpperCase()
    if (label !== "ABCD"[options.length]) break
    const parts = []
    if ((m[2] || "").trim()) parts.push(m[2].trim())
    i++
    while (
      i < lines.length &&
      !/^([A-D])(?:\.\s+\S|\.\s*$|\s*$)/i.test(lines[i]) &&
      !/^(Đáp\s*án|Trả\s*lời)/i.test(lines[i])
    ) {
      if (/^\d{1,4}$/.test(lines[i])) {
        i++
        continue
      }
      parts.push(lines[i])
      i++
    }
    const content = parts.join("\n").trim()
    if (!content) break
    options.push({ label, content })
  }
  if (options.length < 2) return null
  const stem = cleanStem(
    lines
      .slice(0, start)
      .filter((l) => !/^\d{1,4}$/.test(l))
      .join("\n")
  )
  if (stem.length < 8) return null
  const rest = lines.slice(i).join("\n")
  const key = splitAnswerSection(rest)
  const correct = new Set()
  for (const m of (key.answerText || "").matchAll(/\b([A-D])\b/gi)) correct.add(m[1].toUpperCase())
  for (const o of options) o.isCorrect = correct.has(o.label)
  return { stem, options, answerText: key.answerText || "" }
}

/** Trả về field mới, hoặc null nếu không cần sửa. */
export function repairQaFields(content, explanation) {
  if (looksLikeStoredGarbage(content)) return null
  const originalContent = content || ""
  const originalExplanation = explanation || ""
  let c = originalContent.replace(/<br\s*\/?>/gi, "\n")
  let e = originalExplanation.replace(/<br\s*\/?>/gi, "\n")
  if (!e.trim()) {
    const split = splitAnswerSection(c)
    if (split.answerText) {
      c = split.body
      e = split.answerText
    } else {
      const byScore = splitOnScoreLine(c)
      if (byScore) {
        c = byScore.body
        e = byScore.answerText
      }
    }
  }
  c = cleanStem(c)
  const nextContent = toDisplayHtml(c) || ""
  const nextExplanation = e.trim() ? toDisplayHtml(e) : null
  const prevExplanation = originalExplanation.trim() ? originalExplanation : null
  if (nextContent === originalContent && (nextExplanation || null) === (prevExplanation || null)) {
    return null
  }
  return { content: nextContent, explanation: nextExplanation }
}

if (import.meta.main) {
  const doLuong = `1: (4 đ)
Câu hỏi: Một phép đo dòng điện được lặp lại nhiều lần.
	•	Giá trị trung bình số học
	•	Các độ lệch khỏi giá trị trung bình
4,0 đ
Đáp án: 

Giá trị trung bình số học được tính như sau:
1 đ
Độ lệch khỏi giá trị trung bình của mỗi lần đo:
0,5 đ`
  const fixed = repairQaFields(doLuong, "")
  if (!fixed || /Đáp án/i.test(fixed.content) || !fixed.explanation?.includes("Giá trị trung bình")) {
    console.error("FAIL split", fixed)
    process.exit(1)
  }
  if (!fixed.content.includes("<br />") || !fixed.content.includes("•")) {
    console.error("FAIL breaks", fixed)
    process.exit(1)
  }
  if (/0,5|4,0|1 đ/.test(fixed.explanation)) {
    console.error("FAIL score left in answer", fixed.explanation)
    process.exit(1)
  }
  const already = `Để thực hiện được chức năng.\n- Phải có tính tiết kiệm;\n- Phải có tính cơ động.`
  const html = toDisplayHtml(already)
  if (!html.includes("<br />- Phải có tính cơ động")) {
    console.error("FAIL list", html)
    process.exit(1)
  }
  const scored = repairQaFields("Câu hỏi: Biztalk Server là gì và vì sao cần dùng?\n6đ\nBiztalk server dùng để tự động hóa trao đổi thông tin giữa các hệ thống.", "")
  if (!scored?.explanation?.includes("Biztalk server dùng")) {
    console.error("FAIL score split", scored)
    process.exit(1)
  }
  const mc = extractLinedMc("Yêu cầu chọn áp tô mát bảo vệ máy bơm 17kW\nA.\nUđm =600V; Iđm=20A; 2 cực\nB.\nUđm =600V; Iđm=40A; 3 cực\nC.\nUđm =250V; Iđm=40A; 2 cực\nD.\nUđm =250V; Iđm=20A; 3 cực")
  if (!mc || mc.options.length !== 4 || /A\./.test(mc.stem)) {
    console.error("FAIL mc", mc)
    process.exit(1)
  }
  const imgLine = toDisplayHtml("của tham số\n<img src=\"a.jpg\" width=\"10\" />\nđể phương trình")
  if (imgLine.includes("<br") || !imgLine.includes("tham số <img")) {
    console.error("FAIL inline img", imgLine)
    process.exit(1)
  }
  console.log("nhch-qa-format ok")
  console.log(fixed.content)
  console.log("---")
  console.log(fixed.explanation)
}
