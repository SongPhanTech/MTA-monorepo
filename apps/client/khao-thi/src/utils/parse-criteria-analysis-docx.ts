import { PizZip } from "@workspace/libs/docxjs"
import { XMLParser } from "fast-xml-parser"

export type ParsedAnalysisRow = {
  order: number
  name: string
  questions: string[]
  evidencePlaces: string
  collectionMethod: string
  note: string
}

export type ParsedEvidenceRow = {
  tag: string
  name: string
  information: string
  issuer: string
  note: string
}

export type ParsedCriterionSection = {
  standardOrder: number
  criterionOrder: number
  analysisRows: ParsedAnalysisRow[]
  evidenceRows: ParsedEvidenceRow[]
}

const parser = new XMLParser({ ignoreAttributes: false })

const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

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

export const extractTextFromCell = (cell: Record<string, unknown> | undefined): string => {
  if (!cell) return ""

  const paragraphs = toArray(cell["w:p"] as Record<string, unknown> | Record<string, unknown>[])
  const lines = paragraphs.map((p) => extractRunsFromParagraph(p)).filter(Boolean)
  return lines.join("\n").trim()
}

const parseBulletList = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean)

const parseRequirementName = (
  text: string,
  fallbackOrder: number
): { order: number; name: string } => {
  const dotted = text.match(/^(\d+)\.\s*([\s\S]*)$/)
  if (dotted) {
    return { order: Number.parseInt(dotted[1], 10), name: dotted[2].trim() }
  }

  const glued = text.match(/^(\d+)([^\d].*)$/)
  if (glued) {
    return { order: Number.parseInt(glued[1], 10), name: glued[2].trim() }
  }

  return { order: fallbackOrder, name: text.trim() }
}

const getTableRows = (table: Record<string, unknown>) =>
  toArray(table["w:tr"] as Record<string, unknown> | Record<string, unknown>[])

const getRowCells = (row: Record<string, unknown>) =>
  toArray(row["w:tc"] as Record<string, unknown> | Record<string, unknown>[])

const getTableHeaderText = (table: Record<string, unknown>): string => {
  const rows = getTableRows(table).slice(0, 2)
  return rows
    .map((row) => getRowCells(row).map((cell) => extractTextFromCell(cell)).join(" "))
    .join(" ")
}

const isAnalysisTable = (headerText: string) =>
  headerText.includes("Phân tích tiêu chí") && headerText.includes("Các yêu cầu")

const isEvidenceTable = (headerText: string) => headerText.includes("Mã minh chứng")

const isSignatureTable = (headerText: string) =>
  headerText.includes("TRƯỞNG NHÓM") || headerText.includes("Ký, ghi rõ")

const parseAnalysisTable = (table: Record<string, unknown>): ParsedAnalysisRow[] => {
  const rows = getTableRows(table).slice(2)
  const result: ParsedAnalysisRow[] = []

  for (const [index, row] of rows.entries()) {
    const cells = getRowCells(row).map((cell) => extractTextFromCell(cell))
    if (cells.length < 5) continue

    const firstCell = cells[0] || ""
    if (!firstCell.trim()) continue

    const requirement = parseRequirementName(firstCell, index + 1)

    result.push({
      order: requirement.order,
      name: requirement.name,
      questions: parseBulletList(cells[1] || ""),
      evidencePlaces: cells[3] || "",
      collectionMethod: cells[4] || "",
      note: cells[5] || "",
    })
  }

  return result
}

const parseEvidenceTable = (table: Record<string, unknown>): ParsedEvidenceRow[] => {
  const rows = getTableRows(table).slice(1)
  const result: ParsedEvidenceRow[] = []

  for (const row of rows) {
    const cells = getRowCells(row).map((cell) => extractTextFromCell(cell))
    if (cells.length === 0) continue

    const codeIndex = cells.findIndex((cell) => /PM\.\d+\.\d+\.\d+/.test(cell))
    if (codeIndex === -1) continue

    const tagMatch = cells[codeIndex].match(/PM\.(\d+\.\d+\.\d+)/)
    if (!tagMatch) continue

    const rest = cells.slice(codeIndex + 1)
    result.push({
      tag: tagMatch[1],
      name: (rest[0] || "").trim(),
      information: (rest[1] || "").trim(),
      issuer: (rest[2] || "").trim(),
      note: (rest[3] || "").trim(),
    })
  }

  return result
}

const parseEvidenceTableLocation = (
  table: Record<string, unknown>
): { standardOrder?: number; criterionOrder?: number } => {
  const rows = getTableRows(table).slice(1)
  for (const row of rows) {
    const cells = getRowCells(row).map((cell) => extractTextFromCell(cell))
    const numbers = cells
      .slice(0, 3)
      .map((cell) => cell.match(/^(\d+)$/)?.[1])
      .filter(Boolean)
      .map((value) => Number.parseInt(value!, 10))

    if (numbers.length >= 2) {
      return { standardOrder: numbers[0], criterionOrder: numbers[1] }
    }
  }

  return {}
}

const sectionKey = (standardOrder: number, criterionOrder: number) =>
  `${standardOrder}.${criterionOrder}`

const iterateBodyElements = (
  documentXml: string,
  body: Record<string, unknown>
): Array<{ kind: "p" | "tbl"; data: Record<string, unknown> }> => {
  const bodyMatch = documentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
  if (!bodyMatch) return []

  const bodyXml = bodyMatch[1]
  const paragraphs = toArray(body["w:p"] as Record<string, unknown> | Record<string, unknown>[])
  const tables = toArray(body["w:tbl"] as Record<string, unknown> | Record<string, unknown>[])

  const tagRegex = /<w:(p|tbl)\b/g
  let paragraphIndex = 0
  let tableIndex = 0
  const result: Array<{ kind: "p" | "tbl"; data: Record<string, unknown> }> = []
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

export async function parseCriteriaAnalysisDocx(file: File): Promise<ParsedCriterionSection[]> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = new PizZip(arrayBuffer)
  const documentXml = zip.file("word/document.xml")?.asText()

  if (!documentXml) {
    throw new Error("File Word không hợp lệ")
  }

  const doc = parser.parse(documentXml)
  const body = doc?.["w:document"]?.["w:body"] as Record<string, unknown> | undefined
  if (!body) {
    throw new Error("Không đọc được nội dung Word")
  }

  const elements = iterateBodyElements(documentXml, body)
  const sectionMap = new Map<string, ParsedCriterionSection>()
  const analysisTables: Record<string, unknown>[] = []
  const evidenceTables: Record<string, unknown>[] = []

  for (const element of elements) {
    if (element.kind === "p") {
      const text = extractRunsFromParagraph(element.data).trim()
      if (!text) continue

      const criterionMatch = text.match(/^Tiêu chí\s*(\d+)\.(\d+)\s*:/i)
      if (!criterionMatch) continue

      const standardOrder = Number.parseInt(criterionMatch[1], 10)
      const criterionOrder = Number.parseInt(criterionMatch[2], 10)
      const key = sectionKey(standardOrder, criterionOrder)

      if (!sectionMap.has(key)) {
        sectionMap.set(key, {
          standardOrder,
          criterionOrder,
          analysisRows: [],
          evidenceRows: [],
        })
      }
      continue
    }

    const headerText = getTableHeaderText(element.data)
    if (isSignatureTable(headerText)) continue

    if (isAnalysisTable(headerText)) {
      analysisTables.push(element.data)
      continue
    }

    if (isEvidenceTable(headerText)) {
      evidenceTables.push(element.data)
    }
  }

  for (const table of evidenceTables) {
    const location = parseEvidenceTableLocation(table)
    if (!location.standardOrder || !location.criterionOrder) continue

    const key = sectionKey(location.standardOrder, location.criterionOrder)
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        standardOrder: location.standardOrder,
        criterionOrder: location.criterionOrder,
        analysisRows: [],
        evidenceRows: [],
      })
    }

    const section = sectionMap.get(key)!
    section.evidenceRows = parseEvidenceTable(table)
  }

  const sectionsNeedingAnalysis = Array.from(sectionMap.values())
    .filter((section) => section.analysisRows.length === 0)
    .sort(
      (a, b) =>
        a.standardOrder - b.standardOrder || a.criterionOrder - b.criterionOrder
    )

  let analysisIndex = 0
  for (const table of analysisTables) {
    const rows = parseAnalysisTable(table)
    if (rows.length === 0) continue

    const target =
      sectionsNeedingAnalysis[analysisIndex] ||
      Array.from(sectionMap.values()).find((section) => section.analysisRows.length === 0)

    if (!target) break

    target.analysisRows = rows
    analysisIndex++
  }

  return Array.from(sectionMap.values()).filter(
    (section) => section.analysisRows.length > 0 || section.evidenceRows.length > 0
  )
}
