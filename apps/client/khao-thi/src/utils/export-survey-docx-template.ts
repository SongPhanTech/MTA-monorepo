import { message } from "antd"
import { TemplateHandler } from "easy-template-x"
import PizZip from "pizzip"
import { fetchMinio, getMinioUrl } from "@workspace/libs/utils"
import { saveFile } from "@/utils/saveFile"

import type { SurveyDocxTemplateVariant } from "@/constants/constants"
import {
  formatSpecialAnswerCell,
  getSpecialChoiceLabel,
  type SpecificChoiceItem,
} from "@/utils/survey-specific-choice"

const TEMPLATE_KEYS: Record<SurveyDocxTemplateVariant, string> = {
  GIANG_VIEN: "mta/template/TongHopPhieuGiangVien.docx",
  KHOA: "mta/template/TongHopPhieuKhoa.docx",
  BO_MON: "mta/template/TongHopPhieuBomon.docx",
}


const toUpperVi = (value?: string) => (value || "").trim().toLocaleUpperCase("vi-VN")

export function buildReportTitleSemester(params?: {
  semesterName?: string
  schoolYearName?: string
  trainingSystemName?: string
  trainingObjectTypeName?: string
  surveyName?: string
  reportTitleSemester?: string
}): string {
  if (!params) return ""
  const {
    semesterName = "",
    schoolYearName = "",
    trainingSystemName = "",
    trainingObjectTypeName = "",
    surveyName = "",
    reportTitleSemester = "",
  } = params

  if (reportTitleSemester && reportTitleSemester.trim()) {
    return reportTitleSemester.trim().toLocaleUpperCase("vi-VN")
  }

  // 1. Học kỳ
  let hocKyPart = ""
  const hkMatch = semesterName.match(/h[ọo]c\s*k[ỳy]\s*([0-9A-Za-zÀ-ỹ]+)/i)
  if (hkMatch) {
    let k = hkMatch[1].trim()
    if (k.toUpperCase() === "I") k = "1"
    if (k.toUpperCase() === "II") k = "2"
    if (k.toUpperCase() === "III") k = "3"
    hocKyPart = `HỌC KỲ ${k}`
  } else {
    const hkCodeMatch = semesterName.match(/HK(?:\d{4}[-_])?\s*([0-9]+)/i)
    if (hkCodeMatch) {
      hocKyPart = `HỌC KỲ ${hkCodeMatch[1]}`
    } else {
      const kMatch = semesterName.match(/(?:^|[^\wÀ-ỹ])k[ỳy]\s*([0-9]+)/i)
      if (kMatch) {
        hocKyPart = `HỌC KỲ ${kMatch[1]}`
      } else if (semesterName.trim()) {
        hocKyPart = semesterName
          .replace(/\s+n[ăa]m\s+h[ọo]c.*$/i, "")
          .replace(/\s+n[ăa]m.*$/i, "")
          .trim()
      }
    }
  }

  // 2. Năm học
  let yearRange = ""
  if (schoolYearName) {
    const yMatch = schoolYearName.match(/([0-9]{4}\s*[-–]\s*[0-9]{4})/)
    if (yMatch) {
      yearRange = yMatch[1]
    } else {
      yearRange = schoolYearName
        .replace(/^n[ăa]m\s*h[ọo]c\s*/i, "")
        .replace(/^NH\s*/i, "")
        .trim()
    }
  }

  if (!yearRange && semesterName) {
    const yMatch = semesterName.match(/([0-9]{4}\s*[-–]\s*[0-9]{4})/)
    if (yMatch) {
      yearRange = yMatch[1]
    }
  }

  if (!yearRange && surveyName) {
    const yMatch = surveyName.match(/([0-9]{4}\s*[-–]\s*[0-9]{4})/)
    if (yMatch) {
      yearRange = yMatch[1]
    }
  }

  let namHocPart = ""
  if (yearRange) {
    const normalizedYear = yearRange.replace(/\s*[-–]\s*/, " – ")
    namHocPart = `NĂM HỌC ${normalizedYear}`
  }

  // 3. Hệ đào tạo
  let heDaoTaoPart = ""
  const rawSystem = (trainingSystemName || "").trim()
  const rawObject = (trainingObjectTypeName || "").trim()

  let systemName = rawSystem
  if (!systemName) {
    if (/d[âa]n\s*s[ựu]/i.test(rawObject)) {
      systemName = "Dân sự"
    } else if (/qu[âa]n\s*s[ựu]/i.test(rawObject)) {
      systemName = "Quân sự"
    } else if (rawObject) {
      systemName = rawObject
    }
  }

  if (systemName) {
    const cleanSystem = systemName.replace(/^h[ệe]\s*/i, "").trim()
    heDaoTaoPart = `HỆ ${cleanSystem}`
  }

  const leftParts = [hocKyPart, namHocPart].filter(Boolean).join(" ").trim()
  let result = leftParts
  if (heDaoTaoPart) {
    result = result ? `${result} - ${heDaoTaoPart}` : heDaoTaoPart
  }

  return result.toLocaleUpperCase("vi-VN")
}

type AnswerItem = {
  id: string
  answer: string
  description?: string | null
  count: number
}

type AnswerWithPercent = Omit<AnswerItem, "count"> & {
  total: number
  percent: number
  countRaw: number
  count: string
}

export type ExportSurveyDocxTemplateInput = {
  variant: SurveyDocxTemplateVariant

  surveyName?: string
  trainingObjectTypeName?: string
  semesterName?: string
  schoolYearName?: string
  trainingSystemName?: string
  reportTitleSemester?: string

  lecturerName?: string
  lecturerCode?: string

  departmentName?: string
  departmentCode?: string

  organizationName?: string
  organizationCode?: string

  questions: Array<{
    id?: string
    name?: string
    answers: AnswerItem[]
    specificChoice?: SpecificChoiceItem[]
  }>
  fileName?: string
}

const calcPercent = (answers: AnswerItem[]) => {
  const total = (answers || []).reduce((s, i) => s + Number(i?.count || 0), 0)
  return (answers || []).map((i): AnswerWithPercent => {
    const count = Number(i?.count || 0)
    const percent = total === 0 ? 0 : Number(((count / total) * 100).toFixed(2))
    return {
      ...i,
      total,
      percent,
      countRaw: count,
      count: `${percent}% (${count}/${total})`,
    }
  })
}

const formatCell = ({ percent, count, total }: { percent: number; count: number; total: number }) =>
  `${percent}% (${count}/${total})`

const getCellByOrder = (
  items: AnswerWithPercent[],
  order: number,
  specificChoice?: SpecificChoiceItem[]
) => {
  // Prefer matching by numeric answer value (1..5)
  const foundByAnswer = items.find((p) => Number(p.answer) === order)
  const foundByIndex = items[order - 1]
  const found = foundByAnswer || foundByIndex
  const percentText = found
    ? found.count
    : formatCell({ percent: 0, count: 0, total: items[0]?.total ?? 0 })

  if (!specificChoice?.length) return percentText

  const label = getSpecialChoiceLabel(specificChoice, order - 1, found?.answer ?? String(order))
  return formatSpecialAnswerCell(label, percentText)
}

type AverageRow = {
  id: string
  name: string
  answers: AnswerItem[]
}

const buildAverageRow = (
  questions: ExportSurveyDocxTemplateInput["questions"]
): AverageRow | null => {
  if (!questions?.length) return null
  const first = questions[0]
  if (!first?.answers?.length) return null

  // Cộng theo giá trị answer để không phụ thuộc thứ tự mảng
  const acc = new Map<string, AnswerItem>()
  first.answers.forEach((a) => {
    acc.set(String(a.answer), { ...a, count: 0 })
  })

  questions.forEach((q) => {
    q.answers?.forEach((a) => {
      const key = String(a.answer)
      const cur = acc.get(key) ?? { ...a, count: 0 }
      cur.count = Number(cur.count || 0) + Number(a?.count || 0)
      acc.set(key, cur)
    })
  })

  const base: AnswerItem[] = first.answers.map(
    (a) => acc.get(String(a.answer)) ?? { ...a, count: 0 }
  )

  return {
    id: "DGTB",
    name: "Trung bình chung",
    answers: base,
  }
}

export const isQuestionSpecial = (
  q: ExportSurveyDocxTemplateInput["questions"][number]
): boolean => {
  return Boolean((q as any)?.isSpecial || (q?.specificChoice && q.specificChoice.length > 0))
}

export function formatHeaderWrap(label: string): string {
  if (!label) return ""
  const trimmed = label.trim()
  if (trimmed.includes("\n")) return trimmed

  if (/^rất không\s+/i.test(trimmed)) {
    return trimmed.replace(/^rất không\s+/i, "Rất không\n")
  }
  if (/^hoàn toàn không\s+/i.test(trimmed)) {
    return trimmed.replace(/^hoàn toàn không\s+/i, "Hoàn toàn không\n")
  }
  if (/^không\s+/i.test(trimmed)) {
    return trimmed.replace(/^không\s+/i, "Không\n")
  }
  if (/^rất\s+/i.test(trimmed)) {
    return trimmed.replace(/^rất\s+/i, "Rất\n")
  }

  const words = trimmed.split(/\s+/)
  if (words.length >= 3 && trimmed.length > 12) {
    const mid = Math.ceil(words.length / 2)
    return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ")
  }

  return trimmed
}

const singleBordersXml = `<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders>`
const noneBordersXml = `<w:tblBorders><w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/></w:tblBorders>`
const tblPrExSingle = `<w:tblPrEx>${singleBordersXml}</w:tblPrEx>`
const tcBordersXml = `<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders>`

const makeDiagCell = (w = "1512") => {
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:tl2br w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>Mức</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>Tiêu chí</w:t></w:r></w:p></w:tc>`
}

const isDiagonalHeaderCell = (cell: string) => {
  const cellText = cell.replace(/<[^>]+>/g, "")
  return cellText.includes("Mức") && cellText.includes("Tiêu chí")
}

const makeChiefTitleBold = (xml: string) =>
  xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (paragraph) => {
    const paragraphText = paragraph.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")
    if (!paragraphText.includes("TRƯỞNG BAN")) return paragraph

    return paragraph.replace(/<w:r\b([^>]*)>([\s\S]*?)<\/w:r>/g, (run, attrs, content) => {
      if (content.includes("<w:b/>")) return run
      if (content.includes("<w:rPr>")) {
        return run.replace("<w:rPr>", "<w:rPr><w:b/><w:bCs/>")
      }
      return `<w:r${attrs}><w:rPr><w:b/><w:bCs/></w:rPr>${content}</w:r>`
    })
  })

// Keep the report information in the compact two-column layout used in the
// approved form: the organization and criteria at left, its code at right.
const adaptReportInfoLayout = (xml: string) =>
  xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (paragraph) => {
    const paragraphText = paragraph.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")

    if (/^(?:\d+\.\s*)?(?:Khoa|Bộ môn|Đơn vị)\s*:/i.test(paragraphText)) {
      return paragraph
        .replace(/<w:pStyle\b[^>]*\/>/g, "")
        .replace(/<w:numPr>[\s\S]*?<\/w:numPr>/g, "")
    }

    if (/^Mã\s*(?:khoa|bộ môn|đơn vị)/i.test(paragraphText)) {
      return paragraph.replace(/<w:jc w:val="center"\/>/g, '<w:jc w:val="left"/>')
    }

    if (/^Kết quả đánh giá theo/i.test(paragraphText)) {
      return paragraph
        .replace(/<w:pStyle\b[^>]*\/>/g, "")
        .replace(/<w:numPr>[\s\S]*?<\/w:numPr>/g, "")
    }

    return paragraph
  })

const setXmlAttribute = (tag: string, name: string, value: string) => {
  const attribute = new RegExp(`\\s${name}="[^"]*"`)
  if (attribute.test(tag)) return tag.replace(attribute, ` ${name}="${value}"`)
  return tag.replace(/\/>$/, ` ${name}="${value}"/>`)
}

const applySingleLineSpacing = (paragraph: string) => {
  if (!paragraph.includes("<w:pPr>")) {
    return paragraph.replace(
      /(<w:p\b[^>]*>)/,
      '$1<w:pPr><w:spacing w:line="240" w:lineRule="auto"/></w:pPr>'
    )
  }

  if (!paragraph.includes("<w:spacing")) {
    return paragraph.replace(
      "<w:pPr>",
      '<w:pPr><w:spacing w:line="240" w:lineRule="auto"/>'
    )
  }

  return paragraph.replace(/<w:spacing\b[^>]*\/>/g, (spacing) => {
    return setXmlAttribute(setXmlAttribute(spacing, "w:line", "240"), "w:lineRule", "auto")
  })
}

const centerTableParagraphs = (table: string) => {
  const tableText = table.replace(/<[^>]+>/g, "")
  // The organization information table follows the approved left/right layout.
  if (/(?:Khoa|Bộ môn|Mã khoa|Mã bộ môn|Kết quả đánh giá theo)/i.test(tableText)) {
    return table
  }

  return table.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => {
    // Keep the diagonal header cell layout: Mức right-aligned, Tiêu chí left-aligned!
    if (isDiagonalHeaderCell(cell)) return cell

    return cell.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (paragraph) => {
      if (!paragraph.includes("<w:pPr>")) {
        return paragraph.replace(/(<w:p\b[^>]*>)/, '$1<w:pPr><w:jc w:val="center"/></w:pPr>')
      }
      if (paragraph.includes("<w:jc ")) {
        return paragraph.replace(/<w:jc w:val="[^"]*"\/>/g, '<w:jc w:val="center"/>')
      }
      return paragraph.replace("<w:pPr>", '<w:pPr><w:jc w:val="center"/>')
    })
  })
}

const formatSurveyHeaderRow = (table: string) => {
  const tableText = table.replace(/<[^>]+>/g, "")
  if (!tableText.includes("Mức") || !tableText.includes("Tiêu chí")) return table

  return table.replace(/<w:tr\b([^>]*)>([\s\S]*?)<\/w:tr>/, (row, attributes, content) => {
    const height = '<w:trHeight w:val="1000" w:hRule="atLeast"/>'
    if (content.includes("<w:trPr>")) {
      const withHeight = content.includes("<w:trHeight")
        ? content.replace(/<w:trHeight\b[^>]*\/>/, height)
        : content.replace("<w:trPr>", `<w:trPr>${height}`)
      return `<w:tr${attributes}>${withHeight}</w:tr>`
    }
    return `<w:tr${attributes}><w:trPr>${height}</w:trPr>${content}</w:tr>`
  })
}

const printablePageWidth = 11906 - 1984 - 850

const isLetterheadTable = (table: string) => {
  const tableText = table.replace(/<[^>]+>/g, "")
  return /HỌC VIỆN KĨ THUẬT QUÂN SỰ|CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/.test(tableText)
}

const fitTableToPrintableWidth = (table: string) => {
  if (isLetterheadTable(table)) return table

  const gridMatch = table.match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)
  if (!gridMatch) return table

  const widths = [...gridMatch[0].matchAll(/<w:gridCol\b[^>]*w:w="(\d+)"[^>]*\/>/g)].map(
    (match) => Number(match[1])
  )
  const totalWidth = widths.reduce((total, width) => total + width, 0)
  if (!totalWidth || totalWidth <= printablePageWidth) return table

  const ratio = printablePageWidth / totalWidth
  const scaledWidths = widths.map((width) => Math.round(width * ratio))
  scaledWidths[scaledWidths.length - 1] +=
    printablePageWidth - scaledWidths.reduce((total, width) => total + width, 0)

  let gridIndex = 0
  const scaledGrid = gridMatch[0].replace(/<w:gridCol\b[^>]*w:w="\d+"[^>]*\/>/g, (column) => {
    return setXmlAttribute(column, "w:w", String(scaledWidths[gridIndex++]))
  })

  return table
    .replace(gridMatch[0], scaledGrid)
    .replace(/<w:tblW\b(?=[^>]*w:type="dxa")[^>]*\/>/g, (tableWidth) => {
      return setXmlAttribute(tableWidth, "w:w", String(printablePageWidth))
    })
    .replace(/<w:tcW\b[^>]*w:w="(\d+)"[^>]*\/>/g, (cell, width) => {
      return setXmlAttribute(cell, "w:w", String(Math.round(Number(width) * ratio)))
    })
}

const preserveLetterheadFormatting = (table: string) => {
  if (!isLetterheadTable(table)) return table

  const withOriginalSpacing = table.replace(/<w:spacing\b[^>]*\/>/g, (spacing) => {
    return setXmlAttribute(setXmlAttribute(spacing, "w:line", "360"), "w:lineRule", "auto")
  })

  // Word ignores tblInd when it appears before tblW in tblPr. Remove any
  // existing indent and insert it after tblW, in schema order.
  const withoutIndent = withOriginalSpacing.replace(/<w:tblInd\b[^>]*\/>/g, "")
  const indent = '<w:tblInd w:w="-1132" w:type="dxa"/>'
  return withoutIndent.replace(/(<w:tblW\b[^>]*\/>)/, `$1${indent}`)
}

const normalizeSurveyDocxLayout = (xml: string) => {
  const withRequiredMargins = xml.replace(/<w:pgMar\b[^>]*\/>/g, (margins) => {
    return [
      ["w:top", "1417"], // 2.5 cm
      ["w:bottom", "1134"], // 2 cm
      ["w:left", "1984"], // 3.5 cm
      ["w:right", "850"], // 1.5 cm
    ].reduce((tag, [name, value]) => setXmlAttribute(tag, name, value), margins)
  })

  const withSingleSpacing = withRequiredMargins.replace(
    /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g,
    applySingleLineSpacing
  )

  return withSingleSpacing.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (table) => {
    return preserveLetterheadFormatting(
      formatSurveyHeaderRow(centerTableParagraphs(fitTableToPrintableWidth(table)))
    )
  })
}

export function adaptSurveyDocxXml(originalXml: string): string {
  if (originalXml.includes("{#hasSpecial}") || originalXml.includes("{#dataSpecial}")) {
    const adaptedXml = originalXml.replace(/<w:tbl[\s\S]*?<\/w:tbl>/g, (tblXml) => {
      if (!tblXml.includes("dataNormal") && !tblXml.includes("dataSpecial")) return tblXml
      let fixedTbl = tblXml
      if (!fixedTbl.includes("<w:tblBorders>")) {
        fixedTbl = fixedTbl.replace("<w:tblPr>", `<w:tblPr>${singleBordersXml}`)
      }
      fixedTbl = fixedTbl.replace(/<w:tcPr>([\s\S]*?)<\/w:tcPr>/g, (m, inner) => {
        if (inner.includes("<w:tcBorders>")) return m
        return `<w:tcPr>${tcBordersXml}${inner}</w:tcPr>`
      })
      fixedTbl = fixedTbl.replace(/<w:tr\b([^>]*)>(?!<w:tblPrEx>)/g, `<w:tr$1>${tblPrExSingle}`)
      return fixedTbl.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => isDiagonalHeaderCell(cell) ? makeDiagCell("1512") : cell)
    })
    return makeChiefTitleBold(adaptedXml)
  }

  const marker = "{#data}"
  const dataIdx = originalXml.indexOf(marker)
  if (dataIdx === -1) return makeChiefTitleBold(originalXml)

  const tblStart = originalXml.lastIndexOf("<w:tbl>", dataIdx)
  const tblEnd = originalXml.indexOf("</w:tbl>", dataIdx) + "</w:tbl>".length
  if (tblStart === -1 || tblEnd === -1) return makeChiefTitleBold(originalXml)

  const originalTbl = originalXml.slice(tblStart, tblEnd)

  const rawRows = originalTbl.split("</w:tr>")
  if (rawRows.length < 3) return makeChiefTitleBold(originalXml)

  const dataRowIdx = rawRows.findIndex((r) => r.includes("{#data}"))
  if (dataRowIdx <= 0 || dataRowIdx >= rawRows.length) return makeChiefTitleBold(originalXml)

  const headerRowIdx = dataRowIdx - 1
  const rHeader = rawRows[headerRowIdx]
  const firstTcIdx = rHeader.indexOf("<w:tc>")
  const firstTcEnd = rHeader.indexOf("</w:tc>") + "</w:tc>".length

  const diagCell = makeDiagCell("1512")

  const tblGrid = `<w:tblGrid><w:gridCol w:w="1512"/><w:gridCol w:w="1512"/><w:gridCol w:w="1512"/><w:gridCol w:w="1512"/><w:gridCol w:w="1512"/><w:gridCol w:w="1512"/></w:tblGrid>`

  const dataTblPr = `<w:tblPr><w:tblStyle w:val="LiBang"/><w:tblW w:w="0" w:type="auto"/>${singleBordersXml}<w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>`
  const leadingTblPr = `<w:tblPr><w:tblStyle w:val="LiBang"/><w:tblW w:w="0" w:type="auto"/>${noneBordersXml}<w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>`

  const makeHeaderCell = (w: string, line1: string, line2?: string) => {
    const textContent = line2
      ? `<w:t>${line1}</w:t><w:br/><w:t>${line2}</w:t>`
      : `<w:t>${line1}</w:t>`
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr>${textContent}</w:r></w:p></w:tc>`
  }

  const makeTagHeaderCell = (w: string, tag: string) => {
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="280" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>{${tag}}</w:t></w:r></w:p></w:tc>`
  }

  const makeDataCell = (w: string, tag: string) => {
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>{${tag}}</w:t></w:r></w:p></w:tc>`
  }

  const makeDataRow = (loopTag: string) => {
    return (
      `<w:tr w:rsidR="005B284C" w:rsidRPr="00993BB3" w14:paraId="37D3CDFB" w14:textId="77777777" w:rsidTr="00A5694E">${tblPrExSingle}` +
      `<w:tc><w:tcPr><w:tcW w:w="1512" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>{#${loopTag}}{index}</w:t></w:r></w:p></w:tc>` +
      makeDataCell("1512", "muc1") +
      makeDataCell("1512", "muc2") +
      makeDataCell("1512", "muc3") +
      makeDataCell("1512", "muc4") +
      `<w:tc><w:tcPr><w:tcW w:w="1512" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>{muc5}{/${loopTag}}</w:t></w:r></w:p></w:tc>` +
      `</w:tr>`
    )
  }

  const makeDgtbRow = (prefix: string) => {
    return (
      `<w:tr w:rsidR="007E7608" w:rsidRPr="00993BB3" w14:paraId="13C49F11" w14:textId="77777777" w:rsidTr="00D763A5">${tblPrExSingle}` +
      `<w:tc><w:tcPr><w:tcW w:w="1512" w:type="dxa"/>${tcBordersXml}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="26"/><w:lang w:val="en-US"/></w:rPr><w:t>ĐGTB</w:t></w:r></w:p></w:tc>` +
      makeDataCell("1512", `${prefix}1`) +
      makeDataCell("1512", `${prefix}2`) +
      makeDataCell("1512", `${prefix}3`) +
      makeDataCell("1512", `${prefix}4`) +
      makeDataCell("1512", `${prefix}5`) +
      `</w:tr>`
    )
  }

  // Leading rows (if any, like in TongHopPhieuKhoa.docx)
  let leadingTable = ""
  if (headerRowIdx > 0) {
    let leadingRows = ""
    for (let i = 0; i < headerRowIdx; i++) {
      leadingRows += rawRows[i] + "</w:tr>"
    }
    leadingTable = `<w:tbl>${leadingTblPr}${tblGrid}${leadingRows}</w:tbl>`
  }

  // Table 1 (Normal):
  const tbl1Header =
    `<w:tr w:rsidR="005B284C" w:rsidRPr="00993BB3" w14:paraId="365FEEE0" w14:textId="77777777" w:rsidTr="00A5694E">${tblPrExSingle}` +
    diagCell +
    makeHeaderCell("1512", "Rất không", "đồng ý") +
    makeHeaderCell("1512", "Không", "đồng ý") +
    makeHeaderCell("1512", "Phân vân", "") +
    makeHeaderCell("1512", "Đồng ý", "") +
    makeHeaderCell("1512", "Rất đồng ý", "") +
    `</w:tr>`
  const tbl1 = `<w:tbl>${dataTblPr}${tblGrid}${tbl1Header}${makeDataRow("dataNormal")}${makeDgtbRow("dgtbNormal")}</w:tbl>`

  // Table 2 (Special):
  const specHeaderRow =
    `<w:tr w:rsidR="005B284C" w:rsidRPr="00993BB3" w14:paraId="365FEEE1" w14:textId="77777777" w:rsidTr="00A5694E">${tblPrExSingle}` +
    diagCell +
    makeTagHeaderCell("1512", "specHeader1") +
    makeTagHeaderCell("1512", "specHeader2") +
    makeTagHeaderCell("1512", "specHeader3") +
    makeTagHeaderCell("1512", "specHeader4") +
    makeTagHeaderCell("1512", "specHeader5") +
    "</w:tr>"

  const tbl2 = `<w:tbl>${dataTblPr}${tblGrid}${specHeaderRow}${makeDataRow("dataSpecial")}${makeDgtbRow("dgtbSpecial")}</w:tbl>`

  const blockNormal = `<w:p><w:r><w:t>{#hasNormal}</w:t></w:r></w:p>${tbl1}<w:p><w:r><w:t>{/hasNormal}</w:t></w:r></w:p>`
  const blockSpecial = `<w:p><w:r><w:t>{#hasSpecial}</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr></w:p>${tbl2}<w:p><w:r><w:t>{/hasSpecial}</w:t></w:r></w:p>`

  return makeChiefTitleBold(
    originalXml.slice(0, tblStart) + leadingTable + blockNormal + blockSpecial + originalXml.slice(tblEnd)
  )
}

const buildDocxData = (input: ExportSurveyDocxTemplateInput) => {
  if (!input) return {}

  const allQuestions = input.questions || []
  const questionsWithOrder = allQuestions.map((q, idx) => ({
    ...q,
    orderIndex: idx + 1,
  }))

  const normalQuestions = questionsWithOrder.filter((q) => !isQuestionSpecial(q))
  const specialQuestions = questionsWithOrder.filter((q) => isQuestionSpecial(q))

  const formatRows = (
    questions: typeof questionsWithOrder,
    isSpecialTable = false
  ) => {
    return questions.map((q) => {
      const answersWithPercent = calcPercent(q.answers || [])
      const specificChoice = q.specificChoice || []

      return {
        ...q,
        index: q.orderIndex,
        answers: answersWithPercent.map((a) => ({
          ...a,
          description: a.description || "",
        })),
        muc1: getCellByOrder(answersWithPercent, 1, isSpecialTable ? undefined : specificChoice),
        muc2: getCellByOrder(answersWithPercent, 2, isSpecialTable ? undefined : specificChoice),
        muc3: getCellByOrder(answersWithPercent, 3, isSpecialTable ? undefined : specificChoice),
        muc4: getCellByOrder(answersWithPercent, 4, isSpecialTable ? undefined : specificChoice),
        muc5: getCellByOrder(answersWithPercent, 5, isSpecialTable ? undefined : specificChoice),
      }
    })
  }

  const normalRows = formatRows(normalQuestions, false)
  const specialRows = formatRows(specialQuestions, true)

  const avgNormalRow = buildAverageRow(normalQuestions)
  const dgtbNormalAnswers = avgNormalRow ? calcPercent(avgNormalRow.answers) : []

  const avgSpecialRow = buildAverageRow(specialQuestions)
  const dgtbSpecialAnswers = avgSpecialRow ? calcPercent(avgSpecialRow.answers) : []

  // Headers for special table (Bảng 2)
  const firstSpecialChoices = specialQuestions[0]?.specificChoice || []
  const defaultSpecialHeaders = [
    "Rất không hài lòng",
    "Không hài lòng",
    "Phân vân",
    "Hài lòng",
    "Rất hài lòng",
  ]
  const rawSpecHeader1 =
    getSpecialChoiceLabel(firstSpecialChoices, 0, "1") || defaultSpecialHeaders[0]
  const rawSpecHeader2 =
    getSpecialChoiceLabel(firstSpecialChoices, 1, "2") || defaultSpecialHeaders[1]
  const rawSpecHeader3 =
    getSpecialChoiceLabel(firstSpecialChoices, 2, "3") || defaultSpecialHeaders[2]
  const rawSpecHeader4 =
    getSpecialChoiceLabel(firstSpecialChoices, 3, "4") || defaultSpecialHeaders[3]
  const rawSpecHeader5 =
    getSpecialChoiceLabel(firstSpecialChoices, 4, "5") || defaultSpecialHeaders[4]

  const specHeader1 = formatHeaderWrap(rawSpecHeader1)
  const specHeader2 = formatHeaderWrap(rawSpecHeader2)
  const specHeader3 = formatHeaderWrap(rawSpecHeader3)
  const specHeader4 = formatHeaderWrap(rawSpecHeader4)
  const specHeader5 = formatHeaderWrap(rawSpecHeader5)

  const reportTitleSemester = buildReportTitleSemester({
    semesterName: input.semesterName,
    schoolYearName: input.schoolYearName,
    trainingSystemName: input.trainingSystemName,
    trainingObjectTypeName: input.trainingObjectTypeName,
    surveyName: input.surveyName,
    reportTitleSemester: input.reportTitleSemester,
  })

  // Backward compatibility fallback
  const fallbackRows = formatRows(questionsWithOrder, false)
  const avgOverallRow = buildAverageRow(allQuestions)
  const dgtbOverallAnswers = avgOverallRow ? calcPercent(avgOverallRow.answers) : []

  return {
    ...input,
    hasNormal: normalQuestions.length > 0,
    hasSpecial: specialQuestions.length > 0,
    // Normal table (Bảng 1)
    dataNormal: normalRows,
    dgtbNormal1: getCellByOrder(dgtbNormalAnswers, 1),
    dgtbNormal2: getCellByOrder(dgtbNormalAnswers, 2),
    dgtbNormal3: getCellByOrder(dgtbNormalAnswers, 3),
    dgtbNormal4: getCellByOrder(dgtbNormalAnswers, 4),
    dgtbNormal5: getCellByOrder(dgtbNormalAnswers, 5),
    // Special table (Bảng 2)
    specHeader1,
    specHeader2,
    specHeader3,
    specHeader4,
    specHeader5,
    dataSpecial: specialRows,
    dgtbSpecial1: getCellByOrder(dgtbSpecialAnswers, 1),
    dgtbSpecial2: getCellByOrder(dgtbSpecialAnswers, 2),
    dgtbSpecial3: getCellByOrder(dgtbSpecialAnswers, 3),
    dgtbSpecial4: getCellByOrder(dgtbSpecialAnswers, 4),
    dgtbSpecial5: getCellByOrder(dgtbSpecialAnswers, 5),
    // Backward compatibility
    data: normalRows.length > 0 ? normalRows : fallbackRows,
    questions: fallbackRows,
    dgtb: {
      ...avgOverallRow,
      answers: dgtbOverallAnswers,
      muc1: getCellByOrder(dgtbOverallAnswers, 1),
      muc2: getCellByOrder(dgtbOverallAnswers, 2),
      muc3: getCellByOrder(dgtbOverallAnswers, 3),
      muc4: getCellByOrder(dgtbOverallAnswers, 4),
      muc5: getCellByOrder(dgtbOverallAnswers, 5),
    },
    dgtb1: getCellByOrder(dgtbNormalAnswers.length ? dgtbNormalAnswers : dgtbOverallAnswers, 1),
    dgtb2: getCellByOrder(dgtbNormalAnswers.length ? dgtbNormalAnswers : dgtbOverallAnswers, 2),
    dgtb3: getCellByOrder(dgtbNormalAnswers.length ? dgtbNormalAnswers : dgtbOverallAnswers, 3),
    dgtb4: getCellByOrder(dgtbNormalAnswers.length ? dgtbNormalAnswers : dgtbOverallAnswers, 4),
    dgtb5: getCellByOrder(dgtbNormalAnswers.length ? dgtbNormalAnswers : dgtbOverallAnswers, 5),
    lecturerName: input.lecturerName,
    lecturerCode: input.lecturerCode,
    departmentName: input.departmentName,
    departmentCode: input.departmentCode,
    organizationName: input.organizationName,
    organizationCode: input.organizationCode,
    surveyName: toUpperVi(input.surveyName),
    trainingObjectTypeName: toUpperVi(input.trainingObjectTypeName),
    semesterName: reportTitleSemester || toUpperVi(input.semesterName),
    reportTitleSemester,
    reportSubtitle: reportTitleSemester,
    trainingSystemName: toUpperVi(input.trainingSystemName),
    schoolYearName: toUpperVi(input.schoolYearName),
    soTieuChi: allQuestions.length,
  }
}

const defaultFileName = (variant: SurveyDocxTemplateVariant, surveyName?: string) => {
  const name = (surveyName || "").trim().replace(/[\\/:*?"<>|]+/g, "_")
  if (variant === "GIANG_VIEN") return `Bao_cao_khao_sat_giang_vien_${name || "bao_cao"}.docx`
  if (variant === "BO_MON") return `Bao_cao_khao_sat_bo_mon_${name || "bao_cao"}.docx`
  return `Bao_cao_khao_sat_khoa_${name || "bao_cao"}.docx`
}

export async function exportSurveyDocxTemplate(input: ExportSurveyDocxTemplateInput) {
  const templateUrl = getMinioUrl(TEMPLATE_KEYS[input.variant])
  const fileName = input.fileName || defaultFileName(input.variant, input.surveyName)

  if (!templateUrl) {
    message.error("Không xác định được đường dẫn file mẫu")
    return
  }

  try {
    let templateBuffer: ArrayBuffer | null = null

    // fetchMinio: cache: no-store + query v=timestamp để lấy bản template mới sau khi upload đè
    try {
      const res = await fetchMinio(TEMPLATE_KEYS[input.variant])
      if (res.ok) {
        templateBuffer = await res.arrayBuffer()
      } else {
        console.error("Could not fetch template from MinIO:", res.status, res.statusText)
      }
    } catch (err) {
      console.error("Could not fetch template from MinIO:", err)
    }

    if (!templateBuffer) {
      message.error("Không tải được file mẫu từ MinIO")
      return
    }

    const payload = buildDocxData({
      ...input,
      questions: input.questions || [],
    })

    const zip = new PizZip(templateBuffer)
    const xml = zip.file("word/document.xml")?.asText()
    if (xml) {
      const adaptedXml = normalizeSurveyDocxLayout(adaptReportInfoLayout(adaptSurveyDocxXml(xml)))
      if (adaptedXml !== xml) {
        zip.file("word/document.xml", adaptedXml)
      }
    }

    const repaired = zip.generate({ type: "arraybuffer" })
    const repairedBlob = new Blob([repaired], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const handler = new TemplateHandler()
    const doc = await handler.process(repairedBlob, payload)
    // easy-template-x can rewrite run properties while resolving placeholders.
    // Apply the signature style to the final document, not only to its template.
    const outputZip = new PizZip(await doc.arrayBuffer())
    const outputXml = outputZip.file("word/document.xml")?.asText()
    if (outputXml) {
      outputZip.file(
        "word/document.xml",
        makeChiefTitleBold(normalizeSurveyDocxLayout(adaptReportInfoLayout(outputXml)))
      )
    }
    const finalDoc = new Blob([outputZip.generate({ type: "arraybuffer" })], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    saveFile(fileName, finalDoc)
  } catch (e) {
    console.error(e)
    message.error(`Không thể xuất file Word`)
  }
}
