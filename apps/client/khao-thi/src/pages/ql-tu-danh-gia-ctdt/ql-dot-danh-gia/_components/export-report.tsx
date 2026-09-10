import { useState } from "react"
import { calcEvidenceTags as calcEvidenceTagsApi } from "@workspace/libs/api/exam"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Input, message, Modal, Tooltip } from "antd"
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  type IImageOptions,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
import { saveAs } from "file-saver"
import { FileDown } from "lucide-react"
export default function ExportReport({
  id,
  variant = "icon",
}: {
  id: string
  variant?: "icon" | "button"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefix, setPrefix] = useState<string>("PM")
  const [isExporting, setIsExporting] = useState(false)
  const role = {
    CHAIRMAN: "Chủ tịch hội đồng",
    VICE_PRESIDENT: "Phó chủ tịch hội đồng",
    HEAD_SECRETARY: "Trưởng ban thư ký",
    SECRETARY: "Thư ký",
    MEMBER: "Thành viên",
    ADVISORY_BOARD: "Ban tư vấn",
    HEAD_SPECIALIZED: "Trưởng nhóm chuyên trách",
    SPECIALIZED: "Nhóm chuyên trách",
    NONCOUNCIL_MEMBERS: "Thành viên ngoài hội đồng",
  }
  const rgbToHex = (rgb: string): string | undefined => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return undefined
    const r = Number.parseInt(match[1], 10)
    const g = Number.parseInt(match[2], 10)
    const b = Number.parseInt(match[3], 10)
    return [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  }

  const normalizeColor = (color: string): string | undefined => {
    if (!color) return undefined
    const map: Record<string, string> = {
      black: "000000",
      white: "FFFFFF",
      gray: "808080",
      grey: "808080",
      red: "FF0000",
      green: "008000",
      blue: "0000FF",
      orange: "FFA500",
      yellow: "FFFF00",
      purple: "800080",
      pink: "FFC0CB",
      brown: "A52A2A",
      cyan: "00FFFF",
      magenta: "FF00FF",
    }
    if (map[color.toLowerCase()]) return map[color.toLowerCase()]
    if (color.startsWith("rgb")) return rgbToHex(color)
    if (color.startsWith("#")) return color.replace("#", "").toUpperCase()
    return color
  }

  const exportDanhSachHoiDong = (dataTable: any) => {
    const title = new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "DANH SÁCH CÁC ĐỒNG CHÍ THAM GIA HỘI ĐỒNG",
          bold: true,
          size: 32,
          color: "000000",
        }),
      ],
    })

    // ==== Tạo header bảng ====
    const headerRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [new Paragraph("TT")],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Quân hàm, học hàm, học vị, họ và tên")],
        }),
        new TableCell({
          width: { size: 23, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Chức vụ, đơn vị")],
        }),
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Chức vụ trong HĐ")],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Chữ ký")],
        }),
      ],
    })

    // ==== Tạo các dòng dữ liệu ====
    const dataRows = dataTable.map(
      (item: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new TableCell({
              children: [
                new Paragraph(
                  [
                    item?.lecturer?.userProfile?.rank?.sTen,
                    item?.lecturer?.userProfile?.academicDegreeType?.sTen,
                    item?.lecturer?.userProfile?.academicRankType?.sTen,
                  ]
                    .filter(Boolean)
                    .join(", ") +
                    " " +
                    [item?.lecturer?.userProfile?.lastName, item?.lecturer?.userProfile?.firstName]
                      .filter(Boolean)
                      .join(" ")
                ),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(
                  [
                    item?.lecturer?.userProfile?.positionCPV?.sTen,
                    item?.lecturer?.organization?.sMa,
                  ]
                    .filter(Boolean)
                    .join(", ")
                ),
              ],
            }),
            new TableCell({
              children: Array.isArray(item.role)
                ? item.role.map((r: string) => new Paragraph(role[r as keyof typeof role] || r))
                : [new Paragraph(role[item.role as keyof typeof role] || item.role)],
            }),
            new TableCell({ children: [new Paragraph("")] }),
          ],
        })
    )

    // ==== Tạo bảng ====
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow, ...dataRows],
    })

    return [title, new Paragraph(""), table]
  }
  const exportDanhSachMinhchung = (dataTable: any, prefixStr: string = "PM") => {
    const title = new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "BẢNG DANH MỤC MINH CHỨNG",
          bold: true,
          size: 32,
          color: "000000",
        }),
      ],
    })

    // ==== Tạo header bảng ====
    const headerRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [new Paragraph("TT")],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Mã mới")],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Tên minh chứng")],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Số, ngày ban hành")],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Nơi ban hành")],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph("Ghi chú")],
        }),
      ],
    })

    // ==== Tạo các dòng dữ liệu ====
    const dataRows = dataTable.map(
      (item: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new TableCell({
              children: [new Paragraph(`${prefixStr}.${item?.tag || ""}`)],
            }),
            new TableCell({
              children: [new Paragraph(`${item?.evidence?.name || ""}`)],
            }),
            new TableCell({
              children: [new Paragraph(`${item?.evidence?.information || ""}`)],
            }),
            new TableCell({
              children: [new Paragraph(`${item?.evidence?.issuer || ""}`)],
            }),
            new TableCell({ children: [new Paragraph("")] }),
          ],
        })
    )

    // ==== Tạo bảng ====
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow, ...dataRows],
    })

    return [title, new Paragraph(""), table]
  }

  const htmlToParagraphs = async (
    container: HTMLElement,
    isInsideTable = false
  ): Promise<(Paragraph | Table)[]> => {
    const paragraphs: (Paragraph | Table)[] = []

    const extractRuns = (n: Node, currentStyle: any = { size: 28 }): TextRun[] => {
      const runs: TextRun[] = []
      if (n.nodeType === Node.TEXT_NODE) {
        if (n.textContent) runs.push(new TextRun({ text: n.textContent, ...currentStyle }))
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement
        const newStyle = { ...currentStyle }
        if (el.tagName === "B" || el.tagName === "STRONG" || el.style.fontWeight === "bold")
          newStyle.bold = true
        if (el.tagName === "I" || el.tagName === "EM" || el.style.fontStyle === "italic")
          newStyle.italics = true
        if (
          el.tagName === "U" ||
          el.tagName === "INS" ||
          el.style.textDecoration.includes("underline")
        )
          newStyle.underline = { type: "single" } as any
        if (
          el.tagName === "S" ||
          el.tagName === "STRIKE" ||
          el.tagName === "DEL" ||
          el.style.textDecoration.includes("line-through")
        )
          newStyle.strike = true
        const cColor = normalizeColor(el.style.color)
        if (cColor) newStyle.color = cColor
        el.childNodes.forEach((child) => runs.push(...extractRuns(child, newStyle)))
      }
      return runs
    }

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    }

    const traverse = async (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        paragraphs.push(
          new Paragraph({
            indent: isInsideTable ? undefined : { firstLine: 720 },
            alignment: isInsideTable ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            children: [new TextRun({ text: node.textContent, size: 28 })],
          })
        )
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement

        if (el.tagName === "IMG") {
          const src = el.getAttribute("src")
          if (src && /^https?:\/\//i.test(src)) {
            try {
              const res = await fetch(src)
              const blob = await res.blob()
              const reader = new FileReader()
              const base64 = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              const uint8Array = Uint8Array.from(atob(base64.split(",")[1]), (c) => c.charCodeAt(0))
              paragraphs.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: uint8Array,
                      transformation: { width: 400, height: 300 },
                    } as IImageOptions),
                  ],
                })
              )
            } catch (err) {
              console.error("Lỗi tải ảnh:", err)
            }
          }
        } else if (el.tagName === "TABLE") {
          const rows: TableRow[] = []
          const trs = Array.from(
            el.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr")
          )
          for (const tr of trs) {
            const cells: TableCell[] = []
            const tds = Array.from(tr.querySelectorAll(":scope > td, :scope > th"))
            for (const td of tds) {
              const colspan = Number.parseInt(td.getAttribute("colspan") || "1", 10)
              const rowspan = Number.parseInt(td.getAttribute("rowspan") || "1", 10)
              const cellChildren = await htmlToParagraphs(td as HTMLElement, true)
              cells.push(
                new TableCell({
                  children:
                    cellChildren.length > 0
                      ? (cellChildren as Paragraph[])
                      : [new Paragraph({ children: [new TextRun({ text: "", size: 28 })] })],
                  columnSpan: colspan > 1 ? colspan : undefined,
                  rowSpan: rowspan > 1 ? rowspan : undefined,
                  verticalAlign: VerticalAlign.CENTER,
                  borders: cellBorders,
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                })
              )
            }
            rows.push(new TableRow({ children: cells }))
          }
          paragraphs.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          )
        } else if (
          el.tagName === "P" ||
          el.tagName === "DIV" ||
          el.tagName === "LI" ||
          /^H[1-6]$/.test(el.tagName) ||
          el.tagName === "SPAN"
        ) {
          const runs: TextRun[] = []
          el.childNodes.forEach((child) => runs.push(...extractRuns(child, { size: 28 })))
          paragraphs.push(
            new Paragraph({
              indent: isInsideTable ? undefined : { firstLine: 720 },
              alignment: isInsideTable ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
              children: runs.length > 0 ? runs : [new TextRun({ text: "", size: 28 })],
            })
          )
        } else {
          for (let i = 0; i < el.childNodes.length; i++) {
            await traverse(el.childNodes[i])
          }
        }
      }
    }

    for (const node of Array.from(container.childNodes)) {
      await traverse(node)
    }

    return paragraphs
  }

  const processHtmlContent = (html: string, evidenceTags: Map<string, string>): HTMLElement => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html || "", "text/html")

    const spans = doc.querySelectorAll("span[data-evidence-id]")

    spans.forEach((span) => {
      const id = span.getAttribute("data-evidence-id")
      if (id && evidenceTags.has(id)) {
        span.textContent = evidenceTags.get(id) || ""
        span.removeAttribute("style")
        span.setAttribute("style", "color: red;")
      }
    })

    return doc.body
  }

  const exportBangTongHopKetQua = (
    standards: any[],
    programName: string,
    programCode: string,
    summaryTable: Record<string, "Đ" | "K">,
    evaluationResult?: string,
    signDate?: string,
    signTitle?: string,
    signPosition?: string,
    signerName?: string
  ) => {
    const headerRow1 = new TableRow({
      children: [
        new TableCell({
          rowSpan: 2,
          width: { size: 36, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tiêu chuẩn, tiêu chí", bold: true, size: 24 })],
            }),
          ],
        }),
        new TableCell({
          columnSpan: 2,
          width: { size: 18, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Kết quả đánh giá", bold: true, size: 24 })],
            }),
          ],
        }),
        new TableCell({
          columnSpan: 4,
          width: { size: 46, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tổng hợp theo tiêu chuẩn", bold: true, size: 24 })],
            }),
          ],
        }),
      ],
    })

    const headerRow2 = new TableRow({
      children: [
        new TableCell({
          width: { size: 9, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "K", bold: true, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 9, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Đ", bold: true, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Số tiêu chí K", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tỷ lệ số tiêu chí K (%)", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Số tiêu chí Đ", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tỷ lệ số tiêu chí Đ (%)", bold: true, size: 20 })],
            }),
          ],
        }),
      ],
    })

    const dataRows: TableRow[] = []

    standards?.forEach((std: any) => {
      const criteria = std.criteria || []
      const totalCrit = criteria.length

      const countD = criteria.filter((c: any) => summaryTable[c.id] === "Đ").length
      const countK = criteria.filter((c: any) => summaryTable[c.id] === "K").length

      const rateD = totalCrit > 0 ? ((countD / totalCrit) * 100).toFixed(1) : "0.0"
      const rateK = totalCrit > 0 ? ((countK / totalCrit) * 100).toFixed(1) : "0.0"
      const rowSpanCount = totalCrit + 1

      dataRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Tiêu chuẩn ${std.order}: ${std.name}`,
                      bold: true,
                      italics: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({
              rowSpan: rowSpanCount,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${countK}`, bold: true, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              rowSpan: rowSpanCount,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${rateK}%`, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              rowSpan: rowSpanCount,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${countD}`, bold: true, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              rowSpan: rowSpanCount,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${rateD}%`, size: 22 })],
                }),
              ],
            }),
          ],
        })
      )

      criteria.forEach((crit: any) => {
        const val = summaryTable[crit.id]
        dataRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    indent: { left: 360 },
                    children: [
                      new TextRun({
                        text: `Tiêu chí ${std.order}.${crit.order}: ${crit.name}`,
                        size: 22,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: val === "K" ? "X" : "", bold: true, size: 22 })],
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: val === "Đ" ? "X" : "", bold: true, size: 22 })],
                  }),
                ],
              }),
            ],
          })
        )
      })
    })

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow1, headerRow2, ...dataRows],
    })

    return [
      new Paragraph({
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: "4. Tổng hợp kết quả TĐG CTĐT.",
            bold: true,
            size: 28,
            color: "000000",
          }),
        ],
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Tên CTĐT: ", bold: true, size: 24 }),
          new TextRun({ text: programName || "", size: 24 }),
        ],
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Mã CTĐT: ", bold: true, size: 24 }),
          new TextRun({ text: programCode || "", size: 24 }),
        ],
      }),
      new Paragraph(""),
      table,
      new Paragraph(""),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Tự đánh giá CTĐT: ", bold: true, size: 24 }),
          new TextRun({ text: `${evaluationResult || "..."} `, bold: !!evaluationResult, size: 24 }),
          new TextRun({ text: "(Đạt/Đạt có điều kiện/Không đạt).", italics: true, size: 24 }),
        ],
      }),
      new Paragraph(""),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [new Paragraph("")],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: signDate || "Hà Nội, ngày    tháng    năm 20...",
                        italics: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: signTitle || "CHỦ TỊCH HỘI ĐỒNG",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph(""),
                  new Paragraph(""),
                  new Paragraph(""),
                  ...(signPosition
                    ? [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: signPosition,
                              bold: true,
                              size: 24,
                            }),
                          ],
                        }),
                      ]
                    : []),
                  ...(signerName
                    ? [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: signerName,
                              bold: true,
                              color: "000000",
                              size: 24,
                            }),
                          ],
                        }),
                      ]
                    : []),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph(""),
    ]
  }

  const exportToWord = async (selectedPrefix: string = "PM") => {
    try {
      setIsExporting(true)
      const res = await sqlTransaction([
        {
          model: "EvaluationPeriod",
          operation: "findUnique",
          data: {
            where: { id },
            include: {
              standards: {
                include: {
                  criteria: {
                    include: {
                      analysisCriterions: {
                        include: {
                          requirementCriterions: {
                            include: {
                              evidences: {
                                include: {
                                  evidence: true,
                                },
                              },
                            },
                          },
                        },
                      },
                      evaluationCriterion: true,
                    },
                  },
                },
                orderBy: {
                  order: "asc",
                },
              },
              council: {
                include: {
                  members: {
                    include: {
                      lecturer: {
                        include: {
                          organization: true,
                          userProfile: {
                            include: {
                              rank: true,
                              academicDegreeType: true,
                              academicRankType: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ])
      if (res?.status === 200) {
        const data: any = res?.data[0]
        if (!data) return
        const calcRes = await calcEvidenceTagsApi({ id })
        if (!calcRes?.status || calcRes.status !== 200) {
          message.error("Không thể tính tag minh chứng")
          return
        }
        const prefixStr = (selectedPrefix || "PM").trim()
        const evidenceTags = new Map<string, string>(
          Object.entries(calcRes.data.evidenceTags).map(([k, v]) => [
            k,
            typeof v === "string"
              ? v.replace(/^\[(?:PM|MC|[A-Za-z0-9_-]+)\./i, `[${prefixStr}.`)
              : v,
          ])
        )
        const result = calcRes.data.result

        // ==== Phần Ⅰ. KHÁI QUÁT ====
        const overviewChildren: any[] = []
        overviewChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "Phần Ⅰ. KHÁI QUÁT",
                bold: true,
                size: 32,
                color: "000000",
              }),
            ],
          })
        )

        // 1. Đặt vấn đề
        overviewChildren.push(
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "1. Đặt vấn đề",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          })
        )
        overviewChildren.push(
          ...(await htmlToParagraphs(processHtmlContent(data?.overviewProblem || "", evidenceTags)))
        )

        // 2. Tổng quan chung
        overviewChildren.push(
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "2. Tổng quan chung",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          })
        )
        overviewChildren.push(
          ...(await htmlToParagraphs(processHtmlContent(data?.overviewGeneral || "", evidenceTags)))
        )

        // 3. Kết quả rà soát việc đáp ứng quy định về chuẩn chương trình đào tạo
        overviewChildren.push(
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "3. Kết quả rà soát việc đáp ứng quy định về chuẩn chương trình đào tạo",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          })
        )
        overviewChildren.push(
          ...(await htmlToParagraphs(processHtmlContent(data?.overviewResults || "", evidenceTags)))
        )

        const listMembers = await Promise.all([
          {
            children: exportDanhSachHoiDong(data?.council?.members),
          },
        ])
        const sections = await Promise.all([
          ...data.standards.map(async (standard: any, idx: number) => {
            const children: any = []

            // Phần Ⅱ. TỰ ĐÁNH GIÁ THEO CÁC TIÊU CHUẨN, TIÊU CHÍ (chỉ hiển thị trước Tiêu chuẩn 1)
            if (idx === 0) {
              children.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  heading: HeadingLevel.HEADING_1,
                  children: [
                    new TextRun({
                      text: "Phần Ⅱ. TỰ ĐÁNH GIÁ THEO CÁC TIÊU CHUẨN, TIÊU CHÍ",
                      bold: true,
                      size: 32,
                      color: "000000",
                    }),
                  ],
                })
              )
            }

            // Tiêu chuẩn
            children.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_1,
                children: [
                  new TextRun({
                    text: `Tiêu chuẩn ${idx + 1}: ${(standard.name || "").replace(/^Tiêu chuẩn\s+\d+[:.]\s*/i, "")}`,
                    bold: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              })
            )

            // Mở đầu
            children.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: "Mở đầu:",
                    bold: true,
                    italics: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              })
            )
            children.push(
              ...(await htmlToParagraphs(processHtmlContent(standard.opening || "", evidenceTags)))
            )

            // Tiêu chí
            for (const [cIdx, criterion] of standard.criteria.entries()) {
              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  heading: HeadingLevel.HEADING_2,
                  children: [
                    new TextRun({
                      text: `Tiêu chí ${idx + 1}.${cIdx + 1}: ${(criterion.name || "").replace(/^Tiêu chí\s+[\d.]+[:.]\s*/i, "")}`,
                      size: 28,
                      italics: true,
                      color: "000000",
                    }),
                  ],
                })
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: "1. Mô tả hiện trạng",
                      italics: true,
                      size: 28,
                    }),
                  ],
                })
              )
              children.push(
                ...(await htmlToParagraphs(
                  processHtmlContent(
                    criterion?.evaluationCriterion?.currentSituation || "",
                    evidenceTags
                  )
                ))
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: "2. Điểm mạnh",
                      italics: true,
                      size: 28,
                    }),
                  ],
                })
              )
              children.push(
                ...(await htmlToParagraphs(
                  processHtmlContent(criterion?.evaluationCriterion?.strengths || "", evidenceTags)
                ))
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: "3. Điểm tồn tại",
                      italics: true,
                      size: 28,
                    }),
                  ],
                })
              )
              children.push(
                ...(await htmlToParagraphs(
                  processHtmlContent(criterion?.evaluationCriterion?.weakness || "", evidenceTags)
                ))
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: "4. Kế hoạch hành động",
                      italics: true,
                      size: 28,
                    }),
                  ],
                })
              )
              children.push(
                ...(await htmlToParagraphs(
                  processHtmlContent(criterion?.evaluationCriterion?.actionPlan || "", evidenceTags)
                ))
              )
              const scoreRaw = criterion?.evaluationCriterion?.score || ""
              const scoreText = scoreRaw.replace(/<[^>]*>/g, "").trim()
              const isKhongDat = /không\s*đạt|KĐ\b/i.test(scoreText)
              const isDat = !isKhongDat && /đạt|\bĐ\b/i.test(scoreText)
              const cellBorderScore = {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              }

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({ text: "5. Tự đánh giá: ", bold: true, size: 28 }),
                    new TextRun({ text: "Mức đạt được của tiêu chí:", size: 28 }),
                  ],
                }),
                new Paragraph({
                  indent: { firstLine: 720 },
                  children: [
                    new TextRun({
                      text: "Đánh dấu (×) vào ô tương ứng dưới đây:",
                      italics: true,
                      size: 28,
                    }),
                  ],
                }),
                new Table({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: cellBorderScore,
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({ text: "Không đạt (K)", bold: true, size: 28 }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          borders: cellBorderScore,
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: "Đạt (Đ)", bold: true, size: 28 })],
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: cellBorderScore,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: isKhongDat ? "×" : "", size: 28 })],
                            }),
                          ],
                        }),
                        new TableCell({
                          borders: cellBorderScore,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: isDat ? "×" : "", size: 28 })],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                })
              )
            }

            // Kết luận
            children.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: `Kết luận về Tiêu chuẩn ${idx + 1}:`,
                    bold: true,
                    italics: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              })
            )
            children.push(
              ...(await htmlToParagraphs(
                processHtmlContent(standard?.evaluationCriterion?.conclusion || "", evidenceTags)
              ))
            )

            return { children }
          }),
        ])

        // ==== Phần Ⅲ. KẾT LUẬN ====
        let conclusionStrengths = ""
        let conclusionWeaknesses = ""
        let conclusionPlans = ""
        let conclusionProgramName = ""
        let conclusionProgramCode = ""
        let conclusionEvaluationResult = ""
        let conclusionSignDate = ""
        let conclusionSignTitle = ""
        let conclusionSignPosition = ""
        let conclusionSignerName = ""
        let conclusionSummaryTable: Record<string, "Đ" | "K"> = {}
        let appendixDb = ""
        let appendixDocs = ""
        let appendixEvs = ""
        if (data?.description) {
          try {
            const parsed = JSON.parse(data.description)
            if (typeof parsed === "object" && parsed !== null) {
              conclusionStrengths = parsed.conclusionStrengths || ""
              conclusionWeaknesses = parsed.conclusionWeaknesses || ""
              conclusionPlans = parsed.conclusionPlans || ""
              conclusionProgramName = parsed.conclusionProgramName || ""
              conclusionProgramCode = parsed.conclusionProgramCode || ""
              conclusionEvaluationResult = parsed.conclusionEvaluationResult || ""
              conclusionSignDate = parsed.conclusionSignDate || ""
              conclusionSignTitle = parsed.conclusionSignTitle || ""
              conclusionSignPosition = parsed.conclusionSignPosition || ""
              conclusionSignerName = parsed.conclusionSignerName || ""
              conclusionSummaryTable = parsed.conclusionSummaryTable || {}
              appendixDb = parsed.appendixDatabase || ""
              appendixDocs = parsed.appendixDocuments || ""
              appendixEvs = parsed.appendixEvidences || ""
            }
          } catch {
            // not json
          }
        }

        const conclusionChildren: any[] = []
        conclusionChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "Phần Ⅲ. KẾT LUẬN",
                bold: true,
                size: 32,
                color: "000000",
              }),
            ],
          })
        )

        if (conclusionStrengths || conclusionWeaknesses || conclusionPlans) {
          if (conclusionStrengths) {
            conclusionChildren.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: "1. Tóm tắt những điểm mạnh và những điểm cần phát huy của CTĐT (tổng hợp theo từng tiêu chuẩn).",
                    bold: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              }),
              ...(await htmlToParagraphs(processHtmlContent(conclusionStrengths, evidenceTags)))
            )
          }
          if (conclusionWeaknesses) {
            conclusionChildren.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: "2. Tóm tắt những điểm tồn tại và những vấn đề cần cải tiến chất lượng của CTĐT (tổng hợp theo từng tiêu chuẩn).",
                    bold: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              }),
              ...(await htmlToParagraphs(processHtmlContent(conclusionWeaknesses, evidenceTags)))
            )
          }
          if (conclusionPlans) {
            conclusionChildren.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: "3. Tóm tắt các kế hoạch cải tiến chất lượng CTĐT (tổng hợp theo từng tiêu chuẩn).",
                    bold: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              }),
              ...(await htmlToParagraphs(processHtmlContent(conclusionPlans, evidenceTags)))
            )
          }
        } else {
          conclusionChildren.push(
            ...(await htmlToParagraphs(processHtmlContent(data?.conclude || "", evidenceTags)))
          )
        }

        // 4. Tổng hợp kết quả TĐG CTĐT
        conclusionChildren.push(
          ...exportBangTongHopKetQua(
            data?.standards || [],
            conclusionProgramName || "",
            conclusionProgramCode || "",
            conclusionSummaryTable,
            conclusionEvaluationResult,
            conclusionSignDate,
            conclusionSignTitle,
            conclusionSignPosition,
            conclusionSignerName
          )
        )

        // ==== Phần Ⅳ. PHỤ LỤC ====

        const appendixChildren: any[] = []
        appendixChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "Phần Ⅳ. PHỤ LỤC",
                bold: true,
                size: 32,
                color: "000000",
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "1. Cơ sở dữ liệu kiểm định chất lượng CTĐT",
                bold: true,
                size: 28,
              }),
            ],
          })
        )
        if (appendixDb) {
          appendixChildren.push(
            ...(await htmlToParagraphs(processHtmlContent(appendixDb, evidenceTags)))
          )
        }
        appendixChildren.push(
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "2. Các tư liệu, tài liệu liên quan",
                bold: true,
                size: 28,
              }),
            ],
          })
        )
        if (appendixDocs) {
          appendixChildren.push(
            ...(await htmlToParagraphs(processHtmlContent(appendixDocs, evidenceTags)))
          )
        }
        appendixChildren.push(
          new Paragraph({
            indent: { firstLine: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "3. Danh mục minh chứng sử dụng trong quá trình TĐG và viết báo cáo TĐG",
                bold: true,
                size: 28,
              }),
            ],
          })
        )
        if (appendixEvs) {
          appendixChildren.push(
            ...(await htmlToParagraphs(processHtmlContent(appendixEvs, evidenceTags)))
          )
        }

        const doc = new Document({
          features: {
            updateFields: true,
          },
          sections: [
            ...listMembers,
            {
              properties: {
                type: "nextPage",
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  heading: HeadingLevel.HEADING_1,
                  children: [
                    new TextRun({
                      text: "MỤC LỤC",
                      bold: true,
                      size: 32,
                      color: "000000",
                    }),
                  ],
                }),
                new TableOfContents("Mục lục", {
                  hyperlink: true,
                  headingStyleRange: "1-2",
                }),
              ],
            },
            {
              children: overviewChildren,
            },
            ...sections,
            {
              children: conclusionChildren,
            },
            {
              children: appendixChildren,
            },
            {
              children: exportDanhSachMinhchung(result, prefixStr),
            },
          ],
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, `bao_cao_dot_danh_gia_${data?.name}.docx`)
        setIsOpen(false)
      }
    } catch (error) {
      message.error("Không thể tải file mẫu")
      console.error("Lỗi tải file:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const renderModal = () => (
    <Modal
      title="Xuất báo cáo tự đánh giá"
      open={isOpen}
      onCancel={() => {
        if (!isExporting) setIsOpen(false)
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => setIsOpen(false)} disabled={isExporting}>
            Hủy
          </Button>
          <Button
            type="primary"
            loading={isExporting}
            icon={<FileDown size={14} />}
            onClick={() => {
              const trimmed = prefix.trim()
              if (!trimmed) {
                message.warning("Vui lòng nhập tiền tố minh chứng")
                return
              }
              exportToWord(trimmed)
            }}
            className="flex items-center justify-center"
          >
            Xuất báo cáo
          </Button>
        </div>
      }
      centered
      destroyOnClose
      width={400}
    >
      <div className="py-2">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tiền tố minh chứng:
        </label>
        <Input
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="Nhập tiền tố (vd: PM, MC)"
          allowClear
          className="w-full"
          onPressEnter={() => {
            const trimmed = prefix.trim()
            if (!trimmed) {
              message.warning("Vui lòng nhập tiền tố minh chứng")
              return
            }
            exportToWord(trimmed)
          }}
        />
      </div>
    </Modal>
  )

  if (variant === "button") {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          icon={<FileDown size={14} style={{ display: "inline-flex" }} />}
        >
          Xuất báo cáo
        </Button>
        {renderModal()}
      </>
    )
  }

  return (
    <>
      <Tooltip title="Xuất báo cáo" placement="top">
        <FileDown
          size={17}
          strokeWidth={1.5}
          className="text-base text-green-600 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
      </Tooltip>
      {renderModal()}
    </>
  )
}
