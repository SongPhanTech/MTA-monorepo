import { PizZip } from "@workspace/libs/docxjs"
import { XMLParser } from "fast-xml-parser"
import { extractTextFromCell } from "@/utils/parse-criteria-analysis-docx"

export type ParsedEvaluationSection = {
  standardOrder: number
  criterionOrder: number
  currentSituation: string
  strengths: string
  weakness: string
  actionPlan: string
  score: string
}

type FieldKey = keyof Pick<
  ParsedEvaluationSection,
  "currentSituation" | "strengths" | "weakness" | "actionPlan" | "score"
>

type BodyElement = { kind: "p" | "tbl"; data: Record<string, unknown> }

const parser = new XMLParser({ ignoreAttributes: false })

const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const extractTextFromWt = (wt: unknown): string => {
  if (wt === null || wt === undefined) return ""
  if (Array.isArray(wt)) return wt.map((t) => extractTextFromWt(t)).join("")
  if (typeof wt === "number") return String(wt)
  if (typeof wt === "string") return wt
  if (typeof wt === "object" && wt !== null && "#text" in wt) {
    return extractTextFromWt((wt as { "#text": unknown })["#text"])
  }
  return ""
}

const getAttr = (node: Record<string, unknown> | undefined, key: string): string | undefined => {
  if (!node) return undefined
  const value = node[`@_${key}`]
  return typeof value === "string" ? value : undefined
}

const docxColorToCss = (color?: string): string | undefined => {
  if (!color || color === "auto") return undefined
  const normalized = color.replace("#", "").toUpperCase()
  if (normalized.length === 6) return `#${normalized}`
  return undefined
}

const wrapStyledText = (
  text: string,
  style: Record<string, boolean | string | undefined>
): string => {
  if (!text) return ""
  let html = escapeHtml(text)

  if (style.strike) html = `<s>${html}</s>`
  if (style.underline) html = `<u>${html}</u>`
  if (style.italic) html = `<em>${html}</em>`
  if (style.bold) html = `<strong>${html}</strong>`
  if (style.subScript) html = `<sub>${html}</sub>`
  if (style.superScript) html = `<sup>${html}</sup>`
  if (style.color) html = `<span style="color: ${style.color}">${html}</span>`

  return html
}

const extractRunStyle = (run: Record<string, unknown>) => {
  const rPr = run["w:rPr"] as Record<string, unknown> | undefined
  const style: Record<string, boolean | string | undefined> = {}

  if (rPr?.["w:b"] !== undefined) style.bold = true
  if (rPr?.["w:i"] !== undefined) style.italic = true
  if (rPr?.["w:u"] !== undefined) style.underline = true
  if (rPr?.["w:strike"] !== undefined) style.strike = true

  const vertAlign = rPr?.["w:vertAlign"] as Record<string, unknown> | undefined
  const vertVal = getAttr(vertAlign, "w:val")
  if (vertVal === "subscript") style.subScript = true
  if (vertVal === "superscript") style.superScript = true

  const colorNode = rPr?.["w:color"] as Record<string, unknown> | undefined
  style.color = docxColorToCss(getAttr(colorNode, "w:val"))

  return style
}

const findBlipEmbedId = (node: unknown): string | undefined => {
  if (!node || typeof node !== "object") return undefined

  const record = node as Record<string, unknown>
  const embed = getAttr(record, "r:embed")
  if (embed) return embed

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findBlipEmbedId(item)
        if (found) return found
      }
    } else if (typeof value === "object" && value !== null) {
      const found = findBlipEmbedId(value)
      if (found) return found
    }
  }

  return undefined
}

const buildRelationshipMap = (relsXml?: string) => {
  const map = new Map<string, string>()
  if (!relsXml) return map

  const rels = parser.parse(relsXml)
  const relationships = toArray(
    rels?.Relationships?.Relationship as Record<string, unknown> | Record<string, unknown>[]
  )

  for (const rel of relationships) {
    const id = getAttr(rel, "Id")
    const target = getAttr(rel, "Target")
    if (id && target) map.set(id, target)
  }

  return map
}

const imageToHtml = (
  run: Record<string, unknown>,
  zip: PizZip,
  relMap: Map<string, string>
): string => {
  const embedId = findBlipEmbedId(run["w:drawing"])
  if (!embedId) return ""

  const target = relMap.get(embedId)
  if (!target) return ""

  const mediaPath = target.startsWith("media/") ? `word/${target}` : target.replace(/^\//, "")
  const file = zip.file(mediaPath)
  if (!file) return ""

  const bytes = new Uint8Array(file.asArrayBuffer())
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const base64 = btoa(binary)
  const ext = mediaPath.split(".").pop()?.toLowerCase() || "png"
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "gif"
        ? "image/gif"
        : ext === "webp"
          ? "image/webp"
          : "image/png"

  return `<p style="text-align: center"><img src="data:${mime};base64,${base64}" /></p>`
}

const paragraphRunsToHtml = (
  paragraph: Record<string, unknown>,
  zip: PizZip,
  relMap: Map<string, string>
): string => {
  let html = ""

  for (const run of toArray(
    paragraph["w:r"] as Record<string, unknown> | Record<string, unknown>[]
  )) {
    if (run["w:drawing"]) {
      html += imageToHtml(run, zip, relMap)
      continue
    }

    const text = extractTextFromWt(run["w:t"])
    if (!text) continue
    html += wrapStyledText(text, extractRunStyle(run))
  }

  for (const hl of toArray(
    paragraph["w:hyperlink"] as Record<string, unknown> | Record<string, unknown>[]
  )) {
    for (const run of toArray(hl["w:r"] as Record<string, unknown> | Record<string, unknown>[])) {
      const text = extractTextFromWt(run["w:t"])
      if (!text) continue
      html += wrapStyledText(text, extractRunStyle(run))
    }
  }

  return html
}

const paragraphToHtml = (
  paragraph: Record<string, unknown>,
  zip: PizZip,
  relMap: Map<string, string>
): string => {
  const inner = paragraphRunsToHtml(paragraph, zip, relMap)
  if (!inner.trim()) return ""

  const pPr = paragraph["w:pPr"] as Record<string, unknown> | undefined
  const jc = pPr?.["w:jc"] as Record<string, unknown> | undefined
  const align = getAttr(jc, "w:val")
  const style =
    align === "center"
      ? "text-align: center"
      : align === "right"
        ? "text-align: right"
        : align === "both"
          ? "text-align: justify"
          : align === "left"
            ? "text-align: left"
            : "text-align: justify"

  return `<p style="${style}">${inner}</p>`
}

const getTableRows = (table: Record<string, unknown>) =>
  toArray(table["w:tr"] as Record<string, unknown> | Record<string, unknown>[])

const getRowCells = (row: Record<string, unknown>) =>
  toArray(row["w:tc"] as Record<string, unknown> | Record<string, unknown>[])

const cellToHtml = (
  cell: Record<string, unknown>,
  zip: PizZip,
  relMap: Map<string, string>
): string => {
  const paragraphs = toArray(cell["w:p"] as Record<string, unknown> | Record<string, unknown>[])
  const nestedTables = toArray(cell["w:tbl"] as Record<string, unknown> | Record<string, unknown>[])

  const parts = paragraphs
    .map((p) => paragraphToHtml(p, zip, relMap))
    .filter(Boolean)
    .concat(nestedTables.map((tbl) => tableToHtml(tbl, zip, relMap)))

  return parts.join("") || "<p></p>"
}

const tableToHtml = (
  table: Record<string, unknown>,
  zip: PizZip,
  relMap: Map<string, string>
): string => {
  const rows = getTableRows(table)
  const rowHtml = rows
    .map((row) => {
      const cells = getRowCells(row)
        .map((cell) => {
          const tcPr = cell["w:tcPr"] as Record<string, unknown> | undefined
          const gridSpan = tcPr?.["w:gridSpan"] as Record<string, unknown> | undefined
          const vMerge = tcPr?.["w:vMerge"] as Record<string, unknown> | undefined
          const colspan = getAttr(gridSpan, "w:val")
          const rowspan = getAttr(vMerge, "w:val") === "restart" ? "2" : undefined

          const attrs = [
            colspan && colspan !== "1" ? `colspan="${colspan}"` : "",
            rowspan ? `rowspan="${rowspan}"` : "",
          ]
            .filter(Boolean)
            .join(" ")

          return `<td${attrs ? ` ${attrs}` : ""}>${cellToHtml(cell, zip, relMap)}</td>`
        })
        .join("")

      return `<tr>${cells}</tr>`
    })
    .join("")

  return `<table style="border-collapse: collapse; width: 100%;" border="1"><tbody>${rowHtml}</tbody></table>`
}

const elementsToHtml = (
  elements: BodyElement[],
  zip: PizZip,
  relMap: Map<string, string>
): string =>
  elements
    .map((element) =>
      element.kind === "p"
        ? paragraphToHtml(element.data, zip, relMap)
        : tableToHtml(element.data, zip, relMap)
    )
    .join("")
    .trim()

const extractRunsFromParagraph = (p: Record<string, unknown> | undefined): string => {
  if (!p) return ""
  let text = ""

  for (const r of toArray(p["w:r"] as Record<string, unknown> | Record<string, unknown>[])) {
    text += extractTextFromWt(r["w:t"])
  }

  for (const hl of toArray(
    p["w:hyperlink"] as Record<string, unknown> | Record<string, unknown>[]
  )) {
    for (const r of toArray(hl["w:r"] as Record<string, unknown> | Record<string, unknown>[])) {
      text += extractTextFromWt(r["w:t"])
    }
  }

  return text
}

const getTableHeaderText = (table: Record<string, unknown>): string => {
  const rows = getTableRows(table).slice(0, 2)
  return rows
    .map((row) =>
      getRowCells(row)
        .map((cell) => extractTextFromCell(cell))
        .join(" ")
    )
    .join(" ")
}

const isSignatureTable = (headerText: string) =>
  headerText.includes("Xác nhận") ||
  headerText.includes("Người viết") ||
  headerText.includes("TRƯỞNG NHÓM")

const isScoreTable = (headerText: string) =>
  headerText.includes("Không đạt") && headerText.includes("Đạt")

const parseScoreTable = (table: Record<string, unknown>): string => {
  const rows = getTableRows(table)
  if (rows.length < 2) return ""

  const marks = getRowCells(rows[1]).map((cell) => extractTextFromCell(cell).trim())
  const isKhongDat = marks[0] === "×" || marks[0]?.toLowerCase() === "x"
  const isDat = marks[1] === "×" || marks[1]?.toLowerCase() === "x"

  if (isKhongDat) return "<p>Không đạt</p>"
  if (isDat) return "<p>Đạt</p>"
  return ""
}

const detectField = (text: string): FieldKey | null => {
  const normalized = text.trim()
  if (/^1\.\s*Mô tả hiện trạng/i.test(normalized)) return "currentSituation"
  if (/^2\.\s*Điểm mạnh/i.test(normalized)) return "strengths"
  if (/^3\.\s*Điểm tồn tại/i.test(normalized)) return "weakness"
  if (/^4\.\s*Kế hoạch hành động/i.test(normalized)) return "actionPlan"
  if (/^5\.\s*Tự đánh giá/i.test(normalized)) return "score"
  return null
}

const shouldSkipParagraph = (text: string) => {
  const normalized = text.trim()
  if (!normalized) return true
  if (/^PHIẾU TỰ ĐÁNH GIÁ TIÊU CHÍ$/i.test(normalized)) return true
  if (/^Nhóm công tác hoặc cá nhân:/i.test(normalized)) return true
  if (/^Tiêu chuẩn\s+\d+/i.test(normalized)) return true
  if (/^Tiêu chí:/i.test(normalized)) return true
  if (/^Đánh dấu\s*\(×\)/i.test(normalized)) return true
  if (/^Mức đạt được của tiêu chí/i.test(normalized)) return true
  return false
}

const iterateBodyElements = (documentXml: string, body: Record<string, unknown>): BodyElement[] => {
  const bodyMatch = documentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
  if (!bodyMatch) return []

  const bodyXml = bodyMatch[1]
  const paragraphs = toArray(body["w:p"] as Record<string, unknown> | Record<string, unknown>[])
  const tables = toArray(body["w:tbl"] as Record<string, unknown> | Record<string, unknown>[])

  const tagRegex = /<w:(p|tbl)\b/g
  let paragraphIndex = 0
  let tableIndex = 0
  const result: BodyElement[] = []
  let match: RegExpExecArray | null = tagRegex.exec(bodyXml)

  while (match) {
    if (match[1] === "p") {
      const paragraph = paragraphs[paragraphIndex++]
      if (paragraph) result.push({ kind: "p", data: paragraph })
    } else {
      const table = tables[tableIndex++]
      if (table) result.push({ kind: "tbl", data: table })
    }
    match = tagRegex.exec(bodyXml)
  }

  return result
}

const createEmptySection = (
  standardOrder: number,
  criterionOrder: number
): ParsedEvaluationSection => ({
  standardOrder,
  criterionOrder,
  currentSituation: "",
  strengths: "",
  weakness: "",
  actionPlan: "",
  score: "",
})

export async function parseCriteriaEvaluationDocx(file: File): Promise<ParsedEvaluationSection[]> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = new PizZip(arrayBuffer)
  const documentXml = zip.file("word/document.xml")?.asText()
  const relsXml = zip.file("word/_rels/document.xml.rels")?.asText()

  if (!documentXml) {
    throw new Error("File Word không hợp lệ")
  }

  const relMap = buildRelationshipMap(relsXml)
  const doc = parser.parse(documentXml)
  const body = doc?.["w:document"]?.["w:body"] as Record<string, unknown> | undefined
  if (!body) {
    throw new Error("Không đọc được nội dung Word")
  }

  const elements = iterateBodyElements(documentXml, body)
  const sections: ParsedEvaluationSection[] = []
  let currentSection: ParsedEvaluationSection | null = null
  let currentField: FieldKey | null = null
  let buffer: BodyElement[] = []

  const flushBuffer = () => {
    if (!currentSection || !currentField || buffer.length === 0) {
      buffer = []
      return
    }

    const html = elementsToHtml(buffer, zip, relMap)
    if (html) {
      currentSection[currentField] = currentSection[currentField]
        ? `${currentSection[currentField]}${html}`
        : html
    }
    buffer = []
  }

  const finalizeSection = () => {
    flushBuffer()
    if (
      currentSection &&
      (currentSection.currentSituation ||
        currentSection.strengths ||
        currentSection.weakness ||
        currentSection.actionPlan ||
        currentSection.score)
    ) {
      sections.push(currentSection)
    }
    currentSection = null
    currentField = null
    buffer = []
  }

  for (const element of elements) {
    if (element.kind === "p") {
      const text = extractRunsFromParagraph(element.data).trim()

      if (/^PHIẾU TỰ ĐÁNH GIÁ TIÊU CHÍ$/i.test(text)) {
        finalizeSection()
        continue
      }

      const standardMatch = text.match(/^Tiêu chuẩn\s+(\d+)\s*:/i)
      const criterionMatch = text.match(/^Tiêu chí:\s*(\d+)\.(\d+)\s*:/i)

      if (standardMatch || criterionMatch) {
        if (!currentSection) {
          currentSection = createEmptySection(
            standardMatch ? Number.parseInt(standardMatch[1], 10) : 0,
            criterionMatch ? Number.parseInt(criterionMatch[2], 10) : 0
          )
        }
        if (standardMatch) currentSection.standardOrder = Number.parseInt(standardMatch[1], 10)
        if (criterionMatch) {
          currentSection.standardOrder = Number.parseInt(criterionMatch[1], 10)
          currentSection.criterionOrder = Number.parseInt(criterionMatch[2], 10)
        }
        continue
      }

      const field = detectField(text)
      if (field) {
        flushBuffer()
        currentField = field
        continue
      }

      if (!currentField || shouldSkipParagraph(text)) continue
      buffer.push(element)
      continue
    }

    const headerText = getTableHeaderText(element.data)
    if (isSignatureTable(headerText)) continue

    if (isScoreTable(headerText)) {
      flushBuffer()
      if (currentSection) {
        const scoreHtml = parseScoreTable(element.data)
        if (scoreHtml) currentSection.score = scoreHtml
      }
      currentField = null
      continue
    }

    if (!currentField) continue
    buffer.push(element)
  }

  finalizeSection()

  return sections.filter(
    (section) =>
      section.standardOrder > 0 &&
      section.criterionOrder > 0 &&
      (section.currentSituation ||
        section.strengths ||
        section.weakness ||
        section.actionPlan ||
        section.score)
  )
}
