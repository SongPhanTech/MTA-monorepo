import { calcEvidenceTags as calcEvidenceTagsApi } from "@workspace/libs/api/exam"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, message, Tooltip } from "antd"
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
  const role = {
    CHAIRMAN: "Chủ tịch hội đồng",
    VICE_PRESIDENT: "Phó chủ tịch hội đồng",
    HEAD_SECRETARY: "Trưởng ban thư ký",
    SECRETARY: "Thư ký",
    MEMBER: "Thành viên",
    ADVISORY_BOARD: "Ban tư vấn",
    HEAD_SPECIALIZED: "Trưởng nhóm chuyên trách",
    SPECIALIZED: "nhóm chuyên trách",
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
      gray: "808080",
      red: "FF0000",
      green: "008000",
      blue: "0000FF",
      orange: "FFA500",
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
  const exportDanhSachMinhchung = (dataTable: any) => {
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
              children: [new Paragraph(`PM.${item?.tag || ""}`)],
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
    container: HTMLElement
  ): Promise<(Paragraph | Table | Paragraph)[]> => {
    const nodes = Array.from(container.childNodes)

    const paragraphs: (Paragraph | Table | Paragraph)[] = []

    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
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
        }

        if (el.tagName === "TABLE") {
          const rows: TableRow[] = []
          const trs = Array.from(el.querySelectorAll("tr"))
          for (const tr of trs) {
            const cells: TableCell[] = []
            const tds = Array.from(tr.querySelectorAll("td, th"))
            for (const td of tds) {
              const cellChildren = await htmlToParagraphs(td as HTMLElement)
              cells.push(
                new TableCell({
                  children: cellChildren as Paragraph[],
                  width: { size: 100 / tds.length, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
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
        }

        if (el.tagName === "P") {
          const runs: TextRun[] = []
          el.childNodes.forEach(async (child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              runs.push(new TextRun({ text: child.textContent || "", size: 28 }))
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const c = child as HTMLElement
              runs.push(
                new TextRun({
                  text: c.textContent || "",
                  bold: c.tagName === "B" || c.tagName === "STRONG",
                  italics: c.tagName === "I" || c.tagName === "EM",
                  color: normalizeColor(c.style.color),
                  size: 28,
                })
              )
            }
          })
          paragraphs.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: runs,
            })
          )
        }

        if (el.tagName === "SPAN") {
          paragraphs.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: el.textContent || "",
                  color: el.style.color || undefined,
                  bold: el.style.fontWeight === "bold",
                  italics: el.style.fontStyle === "italic",
                  size: 28,
                }),
              ],
            })
          )
        }
      }
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

  const exportToWord = async () => {
    try {
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
        const evidenceTags = new Map<string, string>(Object.entries(calcRes.data.evidenceTags))
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
          ...(await htmlToParagraphs(processHtmlContent(data?.overviewProblem || "", evidenceTags)))
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
                    text: `Tiêu chuẩn ${idx + 1}: ${standard.name}`,
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
                      text: `Tiêu chí ${idx + 1}.${cIdx + 1}: ${criterion.name}`,
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
              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: "5. Tự đánh giá",
                      italics: true,
                      size: 28,
                    }),
                  ],
                })
              )
              children.push(
                ...(await htmlToParagraphs(
                  processHtmlContent(criterion?.evaluationCriterion?.score || "", evidenceTags)
                ))
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
        conclusionChildren.push(
          ...(await htmlToParagraphs(processHtmlContent(data?.conclude || "", evidenceTags)))
        )

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
              children: exportDanhSachMinhchung(result),
            },
          ],
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, `bao_cao_dot_danh_gia_${data?.name}.docx`)
      }
    } catch (error) {
      message.error("Không thể tải file mẫu")
      console.error("Lỗi tải file:", error)
    }
  }
  if (variant === "button") {
    return (
      <Button
        onClick={exportToWord}
        icon={<FileDown size={14} style={{ display: "inline-flex" }} />}
      >
        Xuất báo cáo
      </Button>
    )
  }

  return (
    <Tooltip title="Xuất báo cáo" placement="top">
      <FileDown
        size={17}
        strokeWidth={1.5}
        className="text-base text-green-600"
        onClick={() => exportToWord()}
      />
    </Tooltip>
  )
}
