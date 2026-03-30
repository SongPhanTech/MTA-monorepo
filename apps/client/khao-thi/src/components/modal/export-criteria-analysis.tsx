import { DownloadOutlined } from "@ant-design/icons"
import type { DataTabType } from "@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis"
import { Button } from "antd"
import {
  AlignmentType,
  BorderStyle,
  Document,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
import { saveAs } from "file-saver"

const SIZE_BODY = 22
const SIZE_TITLE = 26

interface ExportCriteriaAnalysisProps {
  data: DataTabType
  idx: number
}

const ExportCriteriaAnalysis = ({ data, idx }: ExportCriteriaAnalysisProps) => {
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  }

  const cellP = (
    text: string,
    opts: { bold?: boolean; italics?: boolean; center?: boolean; size?: number } = {}
  ) =>
    new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [
        new TextRun({
          text,
          bold: opts.bold,
          italics: opts.italics,
          size: opts.size ?? SIZE_BODY,
        }),
      ],
    })

  const makeCell = (
    children: Paragraph[],
    opts: { columnSpan?: number; rowSpan?: number; width?: number; dxa?: boolean } = {}
  ) =>
    new TableCell({
      children: children.length > 0 ? children : [cellP("")],
      borders: cellBorders,
      verticalAlign: VerticalAlign.CENTER,
      ...(opts.columnSpan ? { columnSpan: opts.columnSpan } : {}),
      ...(opts.rowSpan ? { rowSpan: opts.rowSpan } : {}),
      ...(opts.width
        ? {
            width: {
              size: opts.width,
              type: opts.dxa ? WidthType.DXA : WidthType.PERCENTAGE,
            },
          }
        : {}),
    })

  const calcEvidenceTags = () => {
    const map = new Map<string, { tag: string; criterionOrders: number[] }>()
    const result: any[] = []
    const standardOrder = data.order || idx

    for (const [criterionIdx, criterion] of (data.criteria || []).entries()) {
      const analysis = criterion?.analysisCriterions
      if (!analysis) continue

      const reqList = analysis.requirementCriterions
      if (!Array.isArray(reqList)) continue

      let evidenceCount = 0

      for (const req of reqList) {
        const evidencesList = req?.evidences
        if (!Array.isArray(evidencesList)) continue

        for (const ev of evidencesList) {
          const existing = map.get(ev.evidenceId)
          if (existing) {
            const criterionOrder = criterion.order || criterionIdx + 1
            if (!existing.criterionOrders.includes(criterionOrder)) {
              existing.criterionOrders.push(criterionOrder)
            }
            continue
          }

          evidenceCount++
          const criterionOrder = criterion.order || criterionIdx + 1
          const tag = [standardOrder, criterionOrder, evidenceCount]
            .map((t) => t.toString().padStart(2, "0"))
            .join(".")

          result.push({
            ...ev,
            tag,
            criterionOrder,
            criterionOrders: [criterionOrder],
          })
          map.set(ev.evidenceId, { tag, criterionOrders: [criterionOrder] })
        }
      }
    }

    return { evidenceMap: map, evidenceList: result }
  }

  const createAnalysisTable = (criterion: any) => {
    const analysis = criterion?.analysisCriterions
    const requirements = analysis?.requirementCriterions || []

    // Portrait A4: ~9070 DXA usable width (with ~2.5cm margins)
    const COL_YEU_CAU = 1800
    const COL_CAU_HOI = 1800
    const COL_CAN_THU_THAP = 1200
    const COL_NOI_THU_THAP = 1200
    const COL_PHUONG_PHAP = 1200
    const COL_GHI_CHU = 1800

    const headerRow1 = new TableRow({
      children: [
        makeCell([cellP("Phân tích tiêu chí", { bold: true, center: true })], {
          columnSpan: 2,
          width: COL_YEU_CAU + COL_CAU_HOI,
          dxa: true,
        }),
        makeCell([cellP("Thông tin, minh chứng", { bold: true, center: true })], {
          columnSpan: 3,
          width: COL_CAN_THU_THAP + COL_NOI_THU_THAP + COL_PHUONG_PHAP,
          dxa: true,
        }),
        makeCell([cellP("Ghi chú", { bold: true, center: true })], {
          rowSpan: 2,
          width: COL_GHI_CHU,
          dxa: true,
        }),
      ],
    })

    const headerRow2 = new TableRow({
      children: [
        makeCell([cellP("Các yêu cầu", { bold: true, center: true })], {
          width: COL_YEU_CAU,
          dxa: true,
        }),
        makeCell([cellP("Các câu hỏi đặt ra", { bold: true, center: true })], {
          width: COL_CAU_HOI,
          dxa: true,
        }),
        makeCell([cellP("Cần thu thập", { bold: true, center: true })], {
          width: COL_CAN_THU_THAP,
          dxa: true,
        }),
        makeCell([cellP("Nơi thu thập", { bold: true, center: true })], {
          width: COL_NOI_THU_THAP,
          dxa: true,
        }),
        makeCell([cellP("Phương pháp thu thập", { bold: true, center: true })], {
          width: COL_PHUONG_PHAP,
          dxa: true,
        }),
      ],
    })

    const dataRows = requirements.map((req: any, index: number) => {
      const questionParagraphs =
        Array.isArray(req.questions) && req.questions.length > 0
          ? req.questions.map((q: string) => cellP(`- ${q}`))
          : [cellP("")]

      const evidenceParagraphs =
        Array.isArray(req.evidences) && req.evidences.length > 0
          ? req.evidences.map((ev: any) => cellP(`- ${ev?.evidence?.name || ""}`))
          : [cellP("")]

      return new TableRow({
        children: [
          makeCell([cellP(`${index + 1}. ${req.name || ""}`)], {
            width: COL_YEU_CAU,
            dxa: true,
          }),
          makeCell(questionParagraphs, { width: COL_CAU_HOI, dxa: true }),
          makeCell(evidenceParagraphs, { width: COL_CAN_THU_THAP, dxa: true }),
          makeCell([cellP(req.evidencePlaces || "")], {
            width: COL_NOI_THU_THAP,
            dxa: true,
          }),
          makeCell([cellP(req.collectionMethod || "")], {
            width: COL_PHUONG_PHAP,
            dxa: true,
          }),
          makeCell([cellP("")], { width: COL_GHI_CHU, dxa: true }),
        ],
      })
    })

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [
        COL_YEU_CAU,
        COL_CAU_HOI,
        COL_CAN_THU_THAP,
        COL_NOI_THU_THAP,
        COL_PHUONG_PHAP,
        COL_GHI_CHU,
      ],
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
  }

  const createEvidenceTable = (
    evidenceList: any[],
    evidenceMap: Map<string, { tag: string; criterionOrders: number[] }>
  ) => {
    const standardOrder = data.order || idx

    // Group evidences by criterionOrder
    const groups = new Map<number, any[]>()
    for (const ev of evidenceList) {
      const order = ev.criterionOrder
      if (!groups.has(order)) groups.set(order, [])
      groups.get(order)?.push(ev)
    }

    // Portrait A4: ~9070 DXA usable
    const E_COL_TIEU_CHUAN = 700
    const E_COL_TIEU_CHI = 600
    const E_COL_MA_MC = 1100
    const E_COL_TEN_MC = 2000
    const E_COL_SO_NGAY = 1900
    const E_COL_NOI_BH = 1600
    const E_COL_GHI_CHU = 1170

    const headerRow = new TableRow({
      children: [
        makeCell([cellP("Tiêu chuẩn", { bold: true, center: true })], {
          width: E_COL_TIEU_CHUAN,
          dxa: true,
        }),
        makeCell([cellP("Tiêu chí", { bold: true, center: true })], {
          width: E_COL_TIEU_CHI,
          dxa: true,
        }),
        makeCell([cellP("Mã minh chứng", { bold: true, center: true })], {
          width: E_COL_MA_MC,
          dxa: true,
        }),
        makeCell([cellP("Tên minh chứng", { bold: true, center: true })], {
          width: E_COL_TEN_MC,
          dxa: true,
        }),
        makeCell(
          [
            cellP("Số, ngày ban hành, hoặc thời điểm khảo sát, điều tra, phỏng vấn, quan sát,...", {
              bold: true,
              center: true,
            }),
          ],
          { width: E_COL_SO_NGAY, dxa: true }
        ),
        makeCell(
          [
            cellP("Nơi ban hành hoặc nhóm, cá nhân thực hiện", {
              bold: true,
              center: true,
            }),
          ],
          { width: E_COL_NOI_BH, dxa: true }
        ),
        makeCell([cellP("Ghi chú", { bold: true, center: true })], {
          width: E_COL_GHI_CHU,
          dxa: true,
        }),
      ],
    })

    const dataRows: TableRow[] = []
    const totalRows = evidenceList.length
    let isFirstRow = true

    for (const [criterionOrder, evidences] of Array.from(groups.entries()).sort(
      ([a], [b]) => a - b
    )) {
      for (let i = 0; i < evidences.length; i++) {
        const ev = evidences[i]
        const evData = evidenceMap.get(ev.evidenceId)

        let note = ""
        if (evData && evData.criterionOrders.length > 1) {
          const otherCriteria = evData.criterionOrders
            .filter((o: number) => o !== criterionOrder)
            .map((o: number) => `${standardOrder}.${o}`)
            .join(", ")
          if (otherCriteria) {
            note = `Dùng chung với các tiêu chí: ${otherCriteria}`
          }
        }

        const cells: TableCell[] = []

        if (isFirstRow) {
          cells.push(
            makeCell([cellP(`${standardOrder}`, { center: true })], {
              rowSpan: totalRows,
            })
          )
          isFirstRow = false
        }

        if (i === 0) {
          cells.push(
            makeCell([cellP(`${criterionOrder}`, { center: true })], {
              rowSpan: evidences.length > 1 ? evidences.length : undefined,
            })
          )
        }

        cells.push(makeCell([cellP(`PM.${ev.tag || ""}`)]))
        cells.push(makeCell([cellP(ev?.evidence?.name || "")]))
        cells.push(makeCell([cellP(ev?.evidence?.information || "")]))
        cells.push(makeCell([cellP(ev?.evidence?.issuer || "")]))
        cells.push(makeCell([cellP(note)]))

        dataRows.push(new TableRow({ children: cells }))
      }
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow, ...dataRows],
    })
  }

  const exportToWord = async () => {
    try {
      if (!data || !data.criteria || data.criteria.length === 0) {
        console.error("Không có dữ liệu để xuất")
        return
      }

      const { evidenceMap, evidenceList } = calcEvidenceTags()
      const allChildren: any[] = []
      const standardOrder = data.order || idx

      for (const [cidx, criterion] of data.criteria.entries()) {
        if (!criterion.analysisCriterions) continue
        const isFirst = cidx === 0

        const lecturerName =
          criterion.analysisCriterions?.lecturer?.userProfile?.fullname ||
          "............................................."

        // === TIÊU ĐỀ ===
        allChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "PHIẾU THU THẬP, PHÂN TÍCH",
                bold: true,
                size: SIZE_TITLE,
              }),
            ],
          })
        )
        allChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "VÀ XỬ LÝ THÔNG TIN, MINH CHỨNG",
                bold: true,
                size: SIZE_TITLE,
              }),
            ],
          })
        )
        allChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }))

        // === THÔNG TIN HEADER ===
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Nhóm công tác hoặc cá nhân: ",
                size: SIZE_BODY,
                bold: true,
              }),
              new TextRun({ text: lecturerName, size: SIZE_BODY }),
            ],
          })
        )
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Tiêu chuẩn: ",
                size: SIZE_BODY,
                bold: true,
              }),
              new TextRun({
                text: `${standardOrder}: ${data.name || ""}`,
                size: SIZE_BODY,
              }),
            ],
          })
        )
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Tiêu chí: ",
                size: SIZE_BODY,
                bold: true,
                italics: true,
              }),
              new TextRun({
                text: `${standardOrder}.${criterion.order || cidx + 1}: ${criterion.name || ""}`,
                italics: true,
                size: SIZE_BODY,
              }),
            ],
          })
        )
        allChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }))

        // === BẢNG PHÂN TÍCH TIÊU CHÍ ===
        allChildren.push(createAnalysisTable(criterion))
        allChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }))
      }

      // === BẢNG DỰ KIẾN CÁC MINH CHỨNG THEO TIÊU CHÍ ===
      if (evidenceList.length > 0) {
        allChildren.push(
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "DỰ KIẾN CÁC MINH CHỨNG THEO TIÊU CHÍ",
                bold: true,
                size: SIZE_TITLE,
              }),
            ],
          })
        )
        allChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }))
        allChildren.push(createEvidenceTable(evidenceList, evidenceMap))
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Times New Roman",
                size: SIZE_BODY,
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: PageOrientation.PORTRAIT,
                },
                margin: {
                  top: 720,
                  bottom: 720,
                  left: 1134,
                  right: 1134,
                },
              },
            },
            children: allChildren,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `Phieu_phan_tich_tieu_chi_TC${standardOrder}.docx`)
    } catch (error) {
      console.error("Lỗi khi xuất file Word:", error)
    }
  }

  return (
    <Button type="primary" size="small" onClick={exportToWord} icon={<DownloadOutlined />}>
      Xuất file
    </Button>
  )
}

export default ExportCriteriaAnalysis
