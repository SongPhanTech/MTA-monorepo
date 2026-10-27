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

export async function exportGraduateSurveyWord(data: GraduateReportData) {
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
  const safeCourse = (data.surveyInfo.courseName || "").replace(/\s+/g, "_")
  const fileName = `Bao_cao_lay_y_kien_hoc_vien_tot_nghiep_${safeCourse || "HV_tot_nghiep"}.docx`
  saveAs(buffer, fileName)
}

