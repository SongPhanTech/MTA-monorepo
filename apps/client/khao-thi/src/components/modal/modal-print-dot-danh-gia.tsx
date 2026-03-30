// @ts-nocheck

import type {
  DataIndex,
  DataPrintDotDanhGia,
} from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/[id]"
import { Button, Modal } from "antd"
import {
  AlignmentType,
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
import DOMPurify from "dompurify"
import { saveAs } from "file-saver"
import { Bookmark, FileDown, Printer } from "lucide-react"
import { useMemo, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

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

const htmlToParagraphs = async (html: string): Promise<(Paragraph | Table | Paragraph)[]> => {
  const sanitized = DOMPurify.sanitize(html)
  const parser = new DOMParser()
  const doc = parser.parseFromString(sanitized, "text/html")
  const nodes = Array.from(doc.body.childNodes)

  const paragraphs: (Paragraph | Table | Paragraph)[] = []

  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === "IMG") {
        const src = el.getAttribute("src")
        if (src) {
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
            const cellChildren = await htmlToParagraphs(td.innerHTML)
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

const evaluateScore = (score: number | null, scoreScale: any) => {
  if (score === null) {
    return {
      status: "Chưa đánh giá",
      displayText: "Chưa đánh giá",
      isPass: false,
      scoreText: "",
      color: "gray",
    }
  }

  const { minValue, maxValue, passFrom } = scoreScale

  const actualPassFrom =
    passFrom !== null && passFrom !== undefined ? passFrom : Math.round((minValue + maxValue) / 2)

  const isPass = score >= actualPassFrom && score <= maxValue

  return {
    status: isPass ? "Đạt" : "Không đạt",
    displayText: isPass ? "Đạt" : "Không đạt",
    isPass,
    scoreText: `${score}/${maxValue}`,
    color: isPass ? "green" : "red",
  }
}

const EvaluationResult = ({ score }: { score: number | null }) => {
  const evaluation = evaluateScore(score, scoreScale)

  return (
    <span style={{ color: evaluation.color }} className="!font-time-news-roman">
      {evaluation.displayText}, {evaluation.scoreText && `(${evaluation.scoreText})`}
    </span>
  )
}

const processHtmlContent = (html: string, evidenceTags: Map<string, string>): string => {
  if (!html) return ""

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  const spans = doc.querySelectorAll("span[id]")

  spans.forEach((span) => {
    const id = span.getAttribute("id")
    if (id && evidenceTags.has(id)) {
      span.textContent = evidenceTags.get(id) || ""
      ;(span as HTMLElement).style.color = "red"
      span.removeAttribute("style")
      span.setAttribute("style", "color: red;")
    }
  })

  return DOMPurify.sanitize(doc.body.innerHTML)
}

const NavigationSidebar = ({
  standards,
  onNavigate,
}: {
  standards: DataIndex[]
  onNavigate: (id: string) => void
}) => {
  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg p-4 rounded-lg z-10 hidden print:hidden md:block max-h-[100vh] overflow-y-auto">
      <div className="font-bold mb-2 flex items-center gap-2 text-[15px]">
        <Bookmark size={16} />
        Điều hướng
      </div>
      <div className="flex flex-col space-y-2">
        {standards.map((standard, index) => (
          <div key={standard.id} className="pl-2 border-l-2 border-blue-200">
            <Button
              onClick={() => onNavigate(`standard-${standard.id}`)}
              className="text-left text-[15px] font-medium w-full"
            >
              Tiêu chuẩn {index + 1}
            </Button>

            <div className="mt-1 ml-2 flex flex-col space-y-1">
              {standard?.criteria?.map((criterion, idx) => (
                <Button
                  key={criterion.id}
                  onClick={() => onNavigate(`criterion-${criterion.id}`)}
                  className="text-left text-sm w-full text-gray-700"
                >
                  Tiêu chí {index + 1}.{idx + 1}
                </Button>
              ))}

              <Button
                onClick={() => onNavigate(`conclusion-${standard.id}`)}
                className="text-left text-sm w-full mt-1"
              >
                Kết luận {index + 1}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DieuHuong = ({
  standards,
  onNavigate,
}: {
  standards: DataIndex[]
  onNavigate: (id: string) => void
}) => {
  return (
    <div className="p-4 mb-4 print:break-after-page">
      <h2 className="text-xl font-bold text-center mb-4">Mục lục</h2>
      <div className="grid grid-cols-1 gap-2">
        {standards.map((standard, index) => (
          <div key={standard.id} className="pl-4">
            <div
              onClick={() => onNavigate(`standard-${standard.id}`)}
              className="text-left font-bold w-full text-base cursor-pointer"
            >
              Tiêu chuẩn {index + 1}: {standard.name}
            </div>

            <div className="mt-1 ml-4 flex flex-col space-y-1">
              {standard?.criteria?.map((criterion, idx) => (
                <div
                  key={criterion.id}
                  onClick={() => onNavigate(`criterion-${criterion.id}`)}
                  className="text-left w-full text-[15px] cursor-pointer"
                >
                  Tiêu chí {index + 1}.{idx + 1}
                </div>
              ))}

              <div
                onClick={() => onNavigate(`conclusion-${standard.id}`)}
                className="text-left w-full mt-1 text-[15px] cursor-pointer"
              >
                Kết luận về Tiêu chuẩn {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ModalPrintDotDanhGia = () => {
  const { isOpen, onClose, input } = useDisclosure<{ data: DataPrintDotDanhGia }>({
    tag: "ModalPrintDotDanhGia",
  })

  const evidenceTags = useMemo(() => {
    const map = new Map<string, string>()

    for (const [o1, standard] of (input?.data?.standards || []).entries()) {
      for (const [o2, criteria] of (standard?.criteria || []).entries()) {
        let evidenceCount = 0
        for (const requirementCriterions of criteria?.requirementCriterions || []) {
          for (const evidences of requirementCriterions?.evidences || []) {
            if (map.has(evidences.evidenceId)) continue
            evidenceCount++
            const tag = [o1 + 1, o2 + 1, evidenceCount]
              .map((t) => t.toString().padStart(2, "0"))
              .join(".")
            map.set(evidences.evidenceId, `[KM.${tag}]`)
          }
        }
      }
    }
    return map
  }, [input?.data])

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `bao_cao_dot_danh_gia_${input?.data?.name}.pdf`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        .page-break {
          page-break-after: always;
        }
        .blank-page {
          height: 100vh;
          visibility: hidden;
        }
        .paragraph {
          text-indent: 2em;
        }
        .content-wrapper {
          white-space: normal !important;
          word-wrap: break-word !important;
        }
        .navigation-sidebar {
          display: none;
        }
        .table-of-contents {
          page-break-after: always;
        }
      }
    `,
  })
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }
  const exportToWord = async () => {
    if (!input?.data) return

    const sections = await Promise.all(
      input.data.standards.map(async (standard, idx) => {
        const children: Array<Paragraph | Table> = []

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
              processHtmlContent(criterion.currentSituation || "", evidenceTags)
            ))
          )

          children.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: "2. Điểm mạnh", italics: true, size: 28 })],
            })
          )
          children.push(
            ...(await htmlToParagraphs(processHtmlContent(criterion.strengths || "", evidenceTags)))
          )

          children.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: "3. Điểm tồn tại", italics: true, size: 28 })],
            })
          )
          children.push(
            ...(await htmlToParagraphs(processHtmlContent(criterion.weakness || "", evidenceTags)))
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
              processHtmlContent(criterion.actionPlan || "", evidenceTags)
            ))
          )

          children.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: "5. Tự đánh giá", italics: true, size: 28 })],
            })
          )
          children.push(
            new Paragraph({
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({ text: "Tự đánh giá tiêu chí: ", size: 28 }),
                new TextRun({
                  text: `${evaluateScore(criterion?.score, criterion?.scoreScale).displayText} ${evaluateScore(criterion?.score, criterion?.scoreScale).scoreText && `, ${evaluateScore(criterion?.score, criterion?.scoreScale).scoreText}`}`,
                  color: normalizeColor(
                    evaluateScore(criterion?.score, criterion?.scoreScale).color
                  ),
                  size: 28,
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
          ...(await htmlToParagraphs(processHtmlContent(standard.conclusion || "", evidenceTags)))
        )

        return { children }
      })
    )
    const doc = new Document({
      features: {
        updateFields: true,
      },
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: "Mục lục",
                  size: 28,
                  color: "000000",
                }),
              ],
            }),
            new TableOfContents("Mục lục", {
              hyperlink: true,
              headingStyleRange: "1-5",
            }),
          ],
        },
        ...sections,
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `bao_cao_dot_danh_gia_${input.data.name}.docx`)
  }

  return (
    <Modal
      title="Báo cáo đợt đánh giá"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
      className="relative"
    >
      <NavigationSidebar standards={input?.data?.standards || []} onNavigate={scrollToSection} />

      <div className="space-y-4">
        <div className="flex justify-end w-full mb-4 space-x-2">
          <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
            In báo cáo
          </Button>
          <Button type="primary" onClick={() => exportToWord()} icon={<FileDown />}>
            Xuất file Word
          </Button>
        </div>

        <div
          ref={printRef}
          className="!font-time-news-roman text-black bg-white flex flex-col gap-2"
          style={{ whiteSpace: "normal", textAlign: "justify" }}
        >
          <DieuHuong standards={input?.data?.standards || []} onNavigate={scrollToSection} />

          {input?.data?.standards.map((standard, index) => (
            <div
              key={standard.id}
              id={`standard-${standard.id}`}
              className="page-break paragraph flex flex-col gap-2 scroll-mt-16"
            >
              <strong className="text-base block">
                Tiêu chuẩn {index + 1}: {standard?.name}
              </strong>
              <div className="content-wrapper">
                <span className="font-bold italic text-base">Mở đầu: </span>
                <span
                  className="normal-case"
                  style={{ display: "inline" }}
                  dangerouslySetInnerHTML={{
                    __html: processHtmlContent(standard?.opening || "", evidenceTags),
                  }}
                />
              </div>
              <div className="content-wrapper">
                {standard?.criteria?.map((criteria, idx) => (
                  <div
                    id={`criterion-${criteria.id}`}
                    key={criteria?.id}
                    className="content-wrapper mb-2 scroll-mt-16"
                  >
                    <span className="italic text-base">
                      Tiêu chí {index + 1}.{idx + 1}:{" "}
                    </span>
                    <span className="normal-case italic text-base" style={{ display: "inline" }}>
                      {criteria?.name}
                    </span>
                    <div>
                      <span className="italic text-[15px]">1. Mô tả hiện trạng</span>
                      <span
                        className="normal-case"
                        style={{ display: "inline" }}
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(
                            criteria?.currentSituation || "",
                            evidenceTags
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <span className="italic text-[15px]">2. Điểm mạnh</span>
                      <span
                        className="normal-case"
                        style={{ display: "inline" }}
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(criteria?.strengths || "", evidenceTags),
                        }}
                      />
                    </div>
                    <div>
                      <span className="italic text-[15px]">3. Điểm tồn tại</span>
                      <span
                        className="normal-case"
                        style={{ display: "inline" }}
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(criteria?.weakness || "", evidenceTags),
                        }}
                      />
                    </div>
                    <div>
                      <span className="italic text-[15px]">4. Kế hoạch hành động</span>
                      <span
                        className="normal-case"
                        style={{ display: "inline" }}
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(criteria?.actionPlan || "", evidenceTags),
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="italic text-[15px]">5. Tự đánh giá</span>
                      <div className="normal-case" style={{ display: "inline" }}>
                        Tự đánh giá tiêu chí:{" "}
                        <EvaluationResult
                          score={criteria?.score}
                          scoreScale={criteria?.scoreScale}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div id={`conclusion-${standard.id}`} className="content-wrapper scroll-mt-16">
                <span className="font-bold italic text-base">
                  Kết luận về Tiêu chuẩn {index + 1}:
                </span>
                <span
                  className="normal-case"
                  style={{ display: "inline" }}
                  dangerouslySetInnerHTML={{
                    __html: processHtmlContent(standard?.conclusion || "", evidenceTags),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintDotDanhGia
