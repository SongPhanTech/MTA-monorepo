import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
import { saveAs } from "file-saver"
import { fetchMinio } from "@workspace/libs/utils"
import PizZip from "pizzip"

export const GRADUATE_SURVEY_REPORT_TEMPLATE_MINIO_PATH =
  "mta/template/BaoCaoLayYkienHocVienTotNghiep_Mau.docx"

function xmlEscape(str: string): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function makeParagraphXml({
  text,
  bold = false,
  italic = false,
  align = "both",
  indent = true,
  spacingBefore = 0,
  spacingAfter = 120,
  fontSize = 28,
}: {
  text: string
  bold?: boolean
  italic?: boolean
  align?: "both" | "left" | "center" | "right"
  indent?: boolean
  spacingBefore?: number
  spacingAfter?: number
  fontSize?: number
}) {
  const jcVal =
    align === "left" ? "left" : align === "center" ? "center" : align === "right" ? "right" : "both"
  const indXml = indent ? '<w:ind w:firstLine="720"/>' : ""
  const boldXml = bold ? "<w:b/><w:bCs/>" : ""
  const italicXml = italic ? "<w:i/><w:iCs/>" : ""
  const beforeXml = spacingBefore ? ` w:before="${spacingBefore}"` : ""

  return `<w:p>
    <w:pPr>
      <w:spacing w:line="288" w:lineRule="auto"${beforeXml} w:after="${spacingAfter}"/>
      ${indXml}
      <w:jc w:val="${jcVal}"/>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="${fontSize}"/>
        <w:szCs w:val="${fontSize}"/>
      </w:rPr>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        ${boldXml}
        ${italicXml}
        <w:sz w:val="${fontSize}"/>
        <w:szCs w:val="${fontSize}"/>
      </w:rPr>
      <w:t xml:space="preserve">${xmlEscape(text)}</w:t>
    </w:r>
  </w:p>`
}

function buildMajorsTableXml(majors: GraduateMajorItem[]): string {
  const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const half = Math.ceil(majors.length / 2)
  const col1 = majors.slice(0, half)
  const col2 = majors.slice(half)

  let rowsXml = ""
  for (let i = 0; i < half; i++) {
    const m1 = col1[i]
    const m2 = col2[i]

    const cell1Label = m1 ? `- ${m1.name}:` : ""
    const cell1Value = m1 ? `${padZero(m1.taken)}/${padZero(m1.total)}` : ""
    const cell2Label = m2 ? `- ${m2.name}:` : ""
    const cell2Value = m2 ? `${padZero(m2.taken)}/${padZero(m2.total)}` : ""

    rowsXml += `<w:tr>
      <w:tc>
        <w:tcPr><w:tcW w:w="3085" w:type="dxa"/></w:tcPr>
        <w:p><w:pPr><w:spacing w:line="288" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cell1Label)}</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
        <w:p><w:pPr><w:spacing w:line="288" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cell1Value)}</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="3085" w:type="dxa"/></w:tcPr>
        <w:p><w:pPr><w:spacing w:line="288" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cell2Label)}</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
        <w:p><w:pPr><w:spacing w:line="288" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cell2Value)}</w:t></w:r></w:p>
      </w:tc>
    </w:tr>`
  }

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="8570" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
      </w:tblBorders>
      <w:tblLayout w:type="fixed"/>
    </w:tblPr>
    ${rowsXml}
  </w:tbl>`
}

/**
 * Đọc file template docx chuẩn từ MinIO và cập nhật dữ liệu khảo sát vào template.
 * Giữ nguyên 100% định dạng, phông chữ, lề trang từ biểu mẫu của Học viện.
 */
export function fillGraduateSurveyReportTemplate(
  templateBuffer: ArrayBuffer,
  data: GraduateReportData
): Uint8Array {
  const zip = new PizZip(templateBuffer)
  let docXml = zip.file("word/document.xml")?.asText() || ""

  const tblMatches = [...docXml.matchAll(/<w:tbl[\s\S]*?<\/w:tbl>/g)]
  if (tblMatches.length < 3) {
    throw new Error("Template không chứa đủ 3 bảng cấu trúc chuẩn của Học viện")
  }

  const t1 = tblMatches[1]
  const t2 = tblMatches[2]

  let beforeT1 = docXml.slice(0, t1.index)
  // 1. Cập nhật ngày tháng năm ở Header
  if (data.surveyInfo.reportLocationDate) {
    beforeT1 = beforeT1.replace(
      /Hà Nội,\s*ngày\s*tháng\s*năm/g,
      xmlEscape(data.surveyInfo.reportLocationDate)
    )
  }
  // 2. Cập nhật tiêu đề báo cáo
  const courseUpper = (data.surveyInfo.courseName || "").toUpperCase()
  beforeT1 = beforeT1.replace(
    /<w:t>TỪ HỌC VIÊN KHÓA 5<\/w:t>[\s\S]*?<w:t[^>]*>\s*TỐT NGHIỆP\s*<\/w:t>/g,
    `<w:t>TỪ HỌC VIÊN ${xmlEscape(courseUpper)} TỐT NGHIỆP</w:t>`
  )

  // 3. Bảng chuyên ngành (Table 1)
  const newT1 = buildMajorsTableXml(data.sectionA.majors || [])

  // 4. Phần thân giữa Table 1 và Table 2
  let middleXml = ""

  // Phần B
  middleXml += makeParagraphXml({
    text: data.sectionB.title || "B. Nhận xét đánh giá của học viên các chuyên ngành",
    bold: true,
    indent: false,
    spacingBefore: 240,
    spacingAfter: 120,
  })

  ;(data.sectionB.fields || []).forEach((field, fIdx) => {
    const roman = ["I", "II", "III", "IV", "V", "VI"][fIdx] || `${fIdx + 1}`
    middleXml += makeParagraphXml({
      text: `${roman}. ${field.title}`,
      bold: true,
      italic: true,
      indent: false,
      spacingBefore: 160,
      spacingAfter: 80,
    })
    if (field.generalText) {
      middleXml += makeParagraphXml({
        text: field.generalText,
        indent: true,
        spacingAfter: 80,
      })
    }
    if (field.standoutText) {
      middleXml += makeParagraphXml({
        text: field.standoutText,
        indent: true,
        spacingAfter: 120,
      })
    }
  })

  // Phần C
  middleXml += makeParagraphXml({
    text: data.sectionC.title || "C. Tổng hợp chung",
    bold: true,
    indent: false,
    spacingBefore: 240,
    spacingAfter: 120,
  })
  if (data.sectionC.text) {
    middleXml += makeParagraphXml({
      text: data.sectionC.text,
      indent: true,
      spacingAfter: 160,
    })
  }

  // Phần D
  middleXml += makeParagraphXml({
    text: data.sectionD.title || "D. Các ý kiến góp ý của học viên",
    bold: true,
    indent: false,
    spacingBefore: 240,
    spacingAfter: 120,
  })
  if (data.sectionD.introText) {
    middleXml += makeParagraphXml({
      text: data.sectionD.introText,
      indent: true,
      spacingAfter: 120,
    })
  }

  ;(data.sectionD.departments || []).forEach((dept) => {
    middleXml += makeParagraphXml({
      text: `${dept.romanIndex}. ${dept.name}`,
      bold: true,
      indent: false,
      spacingBefore: 160,
      spacingAfter: 80,
    })

    ;(dept.majors || []).forEach((maj) => {
      middleXml += makeParagraphXml({
        text: `${maj.arabicIndex}. ${maj.name}:`,
        italic: true,
        indent: false,
        spacingBefore: 80,
        spacingAfter: 60,
      })

      ;(maj.categories || []).forEach((cat) => {
        middleXml += makeParagraphXml({
          text: cat.title,
          indent: false,
          spacingBefore: 60,
          spacingAfter: 40,
        })

        ;(cat.items || []).forEach((item) => {
          const countPart = item.countText ? ` (${item.countText})` : ""
          middleXml += makeParagraphXml({
            text: `- ${item.text}${countPart}.`,
            indent: true,
            spacingAfter: 40,
          })
        })
      })
    })
  })

  // Kiến nghị
  middleXml += makeParagraphXml({
    text: data.recommendation.title || "Kiến nghị",
    bold: true,
    indent: false,
    spacingBefore: 240,
    spacingAfter: 120,
  })
  if (data.recommendation.text) {
    middleXml += makeParagraphXml({
      text: data.recommendation.text,
      indent: true,
      spacingAfter: 280,
    })
  }

  // Table 2 (Ký tên)
  let afterT2 = docXml.slice(t2.index)
  if (data.recommendation.signTitle) {
    afterT2 = afterT2.replace(
      /<w:t>TRƯỞNG BAN<\/w:t>/g,
      `<w:t>${xmlEscape(data.recommendation.signTitle)}</w:t>`
    )
  }

  const finalDocXml = beforeT1 + newT1 + middleXml + afterT2
  zip.file("word/document.xml", finalDocXml)

  return zip.generate({ type: "uint8array" })
}

export interface GraduateMajorItem {
  name: string
  taken: number
  total: number
  organization?: string
}

export interface GraduateFieldItem {
  id: string
  key: string
  order: number
  title: string
  generalText: string
  standoutText: string
  standoutMajors: string[]
  agreeRatio?: string
}

export interface GraduateFeedbackCategory {
  title: string
  items: Array<{
    text: string
    countText: string
  }>
}

export interface GraduateFeedbackMajor {
  name: string
  arabicIndex: number
  categories: GraduateFeedbackCategory[]
}

export interface GraduateFeedbackDepartment {
  name: string
  romanIndex: string
  majors: GraduateFeedbackMajor[]
}

export interface GraduateReportData {
  surveyInfo: {
    id: string
    name: string
    courseName: string
    surveyDate: string
    reportLocationDate: string
    organizationHeader: string
    departmentHeader: string
    reportTitle: string
  }
  sectionA: {
    title: string
    introText: string
    totalMajors: number
    totalStudents: number
    totalTaken: number
    majors: GraduateMajorItem[]
  }
  sectionB: {
    title: string
    fields: GraduateFieldItem[]
  }
  sectionC: {
    title: string
    satisfactionPercent: number
    satisfiedCount: number
    totalCount: number
    text: string
  }
  sectionD: {
    title: string
    introText: string
    departments: GraduateFeedbackDepartment[]
  }
  recommendation: {
    title: string
    text: string
    signTitle: string
  }
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

async function buildGraduateSurveyWordFallback(data: GraduateReportData): Promise<Blob> {
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: "auto" }
  const tableBordersNone = {
    top: noneBorder,
    bottom: noneBorder,
    left: noneBorder,
    right: noneBorder,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  }

  // 1. Header Table (Quốc hiệu, cơ quan ban hành, ngày tháng)
  const headerTable = new Table({
    width: { size: 8897, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4077, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, lineRule: "auto" },
                children: [
                  new TextRun({
                    text: data.surveyInfo.organizationHeader || "HỌC VIỆN KỸ THUẬT QUÂN SỰ",
                    size: 26,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, lineRule: "auto" },
                children: [
                  new TextRun({
                    text: data.surveyInfo.departmentHeader || "BAN KHẢO THÍ & ĐBCLGD-ĐT",
                    bold: true,
                    size: 26,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, after: 100 },
                children: [new TextRun({ text: "──────────", size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4820, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, lineRule: "auto" },
                children: [
                  new TextRun({
                    text: "CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                    bold: true,
                    size: 26,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, lineRule: "auto" },
                children: [
                  new TextRun({
                    text: "Độc lập - Tự do - Hạnh phúc",
                    bold: true,
                    size: 26,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 240, after: 100 },
                children: [new TextRun({ text: "───────────", size: 18 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, lineRule: "auto" },
                children: [
                  new TextRun({
                    text: data.surveyInfo.reportLocationDate || "Hà Nội, ngày ... tháng ... năm ...",
                    italics: true,
                    size: 28,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  // 2. Title Paragraphs
  const titleLines = (data.surveyInfo.reportTitle || "").split("\n")
  const titleParagraphs = titleLines.map(
    (line, idx) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 288, after: idx === titleLines.length - 1 ? 240 : 60 },
        children: [
          new TextRun({
            text: line.trim(),
            bold: true,
            size: 28,
          }),
        ],
      })
  )

  // 3. Section A: Các chuyên ngành đào tạo và số phiếu lấy ý kiến
  const sectionAHeading = new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: data.sectionA.title || "A. Các chuyên ngành đào tạo và số phiếu lấy ý kiến",
        bold: true,
        size: 28,
      }),
    ],
  })

  const sectionAIntro = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 720 },
    spacing: { line: 288, after: 160 },
    children: [
      new TextRun({
        text: data.sectionA.introText || "",
        size: 28,
      }),
    ],
  })

  // Table 2 (2 majors per row, 4 borderless columns)
  const majors = data.sectionA.majors || []
  const majorRows: TableRow[] = []
  for (let i = 0; i < majors.length; i += 2) {
    const m1 = majors[i]
    const m2 = majors[i + 1]

    majorRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3085, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { line: 288 },
                children: [new TextRun({ text: `- ${m1.name}:`, size: 28 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1310, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { line: 288 },
                children: [
                  new TextRun({
                    text: m1.total > 0 ? `${padZero(m1.taken)}/${padZero(m1.total)}` : ".../...",
                    size: 28,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3402, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { line: 288 },
                children: [new TextRun({ text: m2 ? `- ${m2.name}:` : "", size: 28 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1099, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { line: 288 },
                children: [
                  new TextRun({
                    text: m2 ? (m2.total > 0 ? `${padZero(m2.taken)}/${padZero(m2.total)}` : ".../...") : "",
                    size: 28,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    )
  }

  const majorsTable = new Table({
    width: { size: 8896, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: majorRows,
  })

  // 4. Section B: Nhận xét đánh giá của học viên các chuyên ngành
  const sectionBChildren: Paragraph[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: data.sectionB.title || "B. Nhận xét đánh giá của học viên các chuyên ngành",
          bold: true,
          size: 28,
        }),
      ],
    }),
  ]

  data.sectionB.fields.forEach((field) => {
    sectionBChildren.push(
      new Paragraph({
        spacing: { before: 180, after: 100 },
        children: [
          new TextRun({
            text: field.title,
            bold: true,
            size: 28,
          }),
        ],
      })
    )

    if (field.generalText) {
      sectionBChildren.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { line: 288, after: 120 },
          children: [
            new TextRun({
              text: field.generalText,
              size: 28,
            }),
          ],
        })
      )
    }

    if (field.standoutText) {
      const standoutParagraphs = field.standoutText.split("\n\n")
      standoutParagraphs.forEach((pText) => {
        sectionBChildren.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 },
            spacing: { line: 288, after: 120 },
            children: [
              new TextRun({
                text: pText.trim(),
                size: 28,
              }),
            ],
          })
        )
      })
    }
  })

  // 5. Section C: Tổng hợp chung
  const sectionCChildren: Paragraph[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: data.sectionC.title || "C. Tổng hợp chung",
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { line: 288, after: 160 },
      children: [
        new TextRun({
          text: data.sectionC.text || "",
          size: 28,
        }),
      ],
    }),
  ]

  // 6. Section D: Các ý kiến góp ý của học viên
  const sectionDChildren: Paragraph[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: data.sectionD.title || "D. Các ý kiến góp ý của học viên",
          bold: true,
          size: 28,
        }),
      ],
    }),
  ]

  if (data.sectionD.introText) {
    const introParagraphs = data.sectionD.introText.split("\n\n")
    introParagraphs.forEach((pText) => {
      sectionDChildren.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { line: 288, after: 120 },
          children: [
            new TextRun({
              text: pText.trim(),
              size: 28,
            }),
          ],
        })
      )
    })
  }

  // Duyệt qua từng Khoa / Viện
  data.sectionD.departments.forEach((dept) => {
    sectionDChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `${dept.romanIndex}. ${dept.name}`,
            bold: true,
            size: 28,
          }),
        ],
      })
    )

    dept.majors.forEach((m) => {
      sectionDChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `${m.arabicIndex}. Chuyên ngành ${m.name}`,
              bold: true,
              size: 28,
            }),
          ],
        })
      )

      m.categories.forEach((cat) => {
        sectionDChildren.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: cat.title,
                bold: true,
                size: 28,
              }),
            ],
          })
        )

        cat.items.forEach((item) => {
          const rawText = (item.text || "").trim()
          const cleanText = rawText.startsWith("-") ? rawText.substring(1).trim() : rawText
          const hasCount = Boolean(item.countText && item.countText.trim())

          sectionDChildren.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 288, after: 60 },
              children: [
                new TextRun({
                  text: `- ${cleanText}`,
                  size: 28,
                }),
                ...(hasCount
                  ? [
                      new TextRun({
                        text: ` (${item.countText.trim()}).`,
                        size: 28,
                      }),
                    ]
                  : [
                      new TextRun({
                        text: cleanText.endsWith(".") ? "" : ".",
                        size: 28,
                      }),
                    ]),
              ],
            })
          )
        })
      })
    })
  })

  // 7. Kiến nghị
  const recommendationChildren: Paragraph[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: data.recommendation.title || "Kiến nghị",
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { line: 288, after: 280 },
      children: [
        new TextRun({
          text: data.recommendation.text || "",
          size: 28,
        }),
      ],
    }),
  ]

  // 8. Sign-off Table
  const signTable = new Table({
    width: { size: 8897, type: WidthType.DXA },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            children: [new Paragraph({ text: "" })],
          }),
          new TableCell({
            width: { size: 3897, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 288, after: 400 },
                children: [
                  new TextRun({
                    text: data.recommendation.signTitle || "TRƯỞNG BAN",
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
            ],
          }),
        ],
      }),
    ],
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 28,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1418,
              bottom: 1134,
              left: 1985,
              right: 851,
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ text: "", spacing: { after: 160 } }),
          ...titleParagraphs,
          sectionAHeading,
          sectionAIntro,
          majorsTable,
          ...sectionBChildren,
          ...sectionCChildren,
          ...sectionDChildren,
          ...recommendationChildren,
          signTable,
        ],
      },
    ],
  })

  const buffer = await Packer.toBlob(doc)
  return buffer
}


/**
 * Xuất báo cáo tốt nghiệp dạng file Word:
 * 1. Lấy file biểu mẫu gốc từ MinIO (/mta/template/BaoCaoLayYkienHocVienTotNghiep_Mau.docx)
 * 2. Đổ và cập nhật dữ liệu khảo sát thực tế vào biểu mẫu chuẩn này.
 * 3. Nếu MinIO không khả dụng, tự động chuyển sang chế độ tạo tài liệu Word chuẩn dự phòng.
 */
export async function exportGraduateSurveyWord(data: GraduateReportData): Promise<void> {
  const safeCourse = (data.surveyInfo.courseName || "").replace(/\s+/g, "_")
  const fileName = `Bao_cao_lay_y_kien_hoc_vien_tot_nghiep_${safeCourse || "HV_tot_nghiep"}.docx`

  try {
    const res = await fetchMinio(GRADUATE_SURVEY_REPORT_TEMPLATE_MINIO_PATH)
    if (res.ok) {
      const templateBuffer = await res.arrayBuffer()
      const processed = fillGraduateSurveyReportTemplate(templateBuffer, data)
      const blob = new Blob([processed], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
      saveAs(blob, fileName)
      return
    }
  } catch (err) {
    console.warn("Không thể tải hoặc xử lý template từ MinIO, sử dụng fallback docx:", err)
  }

  // Fallback: Tạo tài liệu Word chuẩn bằng thư viện docx
  const fallbackBlob = await buildGraduateSurveyWordFallback(data)
  saveAs(fallbackBlob, fileName)
}
