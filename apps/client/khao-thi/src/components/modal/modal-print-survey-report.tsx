import {
  EditOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import { Button, Input, InputNumber, Modal } from "antd"
import { Document, Table as DocxTable, Packer, Paragraph, TableCell, TableRow, TextRun } from "docx"
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

const calculatePercent = (items: any[]) => {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    total,
    percent: total === 0 ? 0 : Number(((item.count / total) * 100).toFixed(2)),
  }))
}

const ModalPrintSurvey = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedQuestions, setEditedQuestions] = useState<any[]>([])

  const { isOpen, onClose, input } = useDisclosure<{
    surveyName?: string
    questions: any[]
    summaryInfo: any[]
    chartOption: any
  }>({
    tag: "ModalPrintSurvey",
  })

  useEffect(() => {
    if (input) {
      setEditedTitle(input.surveyName || "")
      setEditedQuestions(input.questions || [])
      setIsEditing(false)
    }
  }, [input])

  const updateAnswerCount = (questionIdx: number, answerId: string, newCount: number) => {
    setEditedQuestions((prev) =>
      prev.map((q, qi) =>
        qi === questionIdx
          ? {
              ...q,
              answers: q.answers.map((a: any) =>
                a.id === answerId ? { ...a, count: newCount } : a
              ),
            }
          : q
      )
    )
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "BAO_CAO_KHAO_SAT",
    pageStyle: `
      @page { size: A4 landscape; margin: 1.5cm; }

      @media print {
        * {
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: "Times New Roman" !important;
          font-size: 13px !important;
          color: #000 !important;
        }

        .no-print { display: none !important; }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000 !important;
        }

        th, td {
          border: 2px solid #000 !important;
          padding: 6px;
          text-align: center;
          vertical-align: middle;
          color: #000 !important;
          font-weight: 500;
        }

        thead { display: table-header-group; }

        thead th {
          background: #fff !important;
          font-weight: bold !important;
        }

        svg text { fill: #000 !important; }
      }
    `,
  })

  const exportExcel = async () => {
    const name = editedTitle
    const dataTable = editedQuestions
    const dataTableInfo = input?.summaryInfo

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("BaoCaoKhaoSat")

    const globalFontStyle = { name: "Times New Roman" }

    const headerTitleStyle = {
      font: { ...globalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const headerSubtitleStyle = {
      font: { ...globalFontStyle, bold: true, size: 16 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const headerSubtitleStyle1 = {
      font: { ...globalFontStyle, bold: true, size: 16 },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const tableHeaderStyle = {
      font: { ...globalFontStyle, bold: true, size: 14, color: { argb: "FF000000" } },
      fill: { type: "pattern", pattern: "none" } as ExcelJS.Fill,
      alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true },
      border: {
        top: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
        left: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
        right: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
        bottom: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
      },
    }

    worksheet.mergeCells("A1:C2")
    worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
    worksheet.getCell("A1").style = headerTitleStyle
    worksheet.getRow(1).height = 30
    worksheet.getRow(2).height = 30

    worksheet.mergeCells("E1:H2")
    worksheet.getCell("E1").value =
      "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
    worksheet.getCell("E1").style = headerTitleStyle

    worksheet.mergeCells("A4:H4")
    worksheet.getCell("A4").value = `Báo cáo khảo sát: ${name}`
    worksheet.getCell("A4").style = headerSubtitleStyle
    worksheet.getRow(4).height = 20

    let rowIndex = 11
    if (dataTableInfo && dataTableInfo?.length > 0) {
      worksheet.mergeCells("A7:C7")
      worksheet.getCell("A7").value = "Thông kê chung"
      worksheet.getCell("A7").style = headerSubtitleStyle1

      const headerRowInfo = worksheet.getRow(9)
      headerRowInfo.values = ["STT", "Đối tượng", "Trạng thái"]
      headerRowInfo.eachCell((cell: any) => {
        cell.style = tableHeaderStyle
      })

      dataTableInfo.forEach((item: any, index: number) => {
        worksheet.getRow(index + 10).values = [
          index + 1,
          item?.name,
          `${item?.taken || 0}/${item?.total || 0}`,
        ]
      })

      rowIndex = 9 + dataTableInfo.length + 3
    }

    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Thống kê theo từng Câu hỏi"
    worksheet.getCell(`A${rowIndex}`).style = headerSubtitleStyle1

    const headerRow = worksheet.getRow(rowIndex + 2)
    headerRow.values = dataTable[0]?.answers?.length
      ? [
          "STT",
          "Câu hỏi",
          "Tên Câu hỏi",
          // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
          ...dataTable[0]?.answers?.map((i: any) => i?.description),
        ]
      : ["STT", "Câu hỏi", "Tên Câu hỏi"]
    headerRow.eachCell((cell: any) => {
      cell.style = tableHeaderStyle
    })

    worksheet.columns = [
      { width: 10 },
      { width: 30 },
      { width: 60 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ]

    dataTable.forEach((i: any, index: number) => {
      const row: any = worksheet.getRow(rowIndex + 3 + index)
      row.values = [
        index + 1,
        `Câu hỏi ${index + 1}`,
        i?.name,
        ...calculatePercent(i?.answers).map(
          (a: any) => `${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`
        ),
      ]
    })

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Bao_cao_khao_sat_${name || ""}.xlsx`)
  }

  const exportWord = async () => {
    const name = editedTitle
    const dataTable = editedQuestions
    const dataTableInfo = input?.summaryInfo

    const centerCell = (text = "") =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: "center",
            children: [new TextRun(text)],
          }),
        ],
      })

    const summaryRows = [
      new TableRow({
        children: [centerCell("STT"), centerCell("Đối tượng"), centerCell("Trạng thái")],
      }),
      ...(dataTableInfo || []).map(
        (i: any, idx: number) =>
          new TableRow({
            children: [
              centerCell(String(idx + 1)),
              new TableCell({ children: [new Paragraph(i?.name || "")] }),
              centerCell(`${i?.taken || 0}/${i?.total || 0}`),
            ],
          })
      ),
    ]

    const answerHeaders = dataTable?.[0]?.answers?.map((a: any) => a.description) || []

    const questionRows = [
      new TableRow({
        children: [
          centerCell("STT"),
          centerCell("Câu hỏi"),
          new TableCell({ children: [new Paragraph("Nội dung câu hỏi")] }),
          ...answerHeaders.map(centerCell),
        ],
      }),
      ...dataTable.map((q: any, idx: number) => {
        const percentData = calculatePercent(q.answers)
        return new TableRow({
          children: [
            centerCell(String(idx + 1)),
            centerCell(`Câu hỏi ${idx + 1}`),
            new TableCell({ children: [new Paragraph(q.name || "")] }),
            ...percentData.map((p) => centerCell(`${p.percent}% (${p.count}/${p.total})`)),
          ],
        })
      }),
    ]

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: "landscape" },
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: [
            new Paragraph({
              alignment: "center",
              spacing: { after: 300 },
              children: [
                new TextRun({ text: `BÁO CÁO KHẢO SÁT: ${name || ""}`, bold: true, size: 28 }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "Thống kê chung", bold: true })],
              spacing: { after: 200 },
            }),
            new DocxTable({ width: { size: 100, type: "pct" }, rows: summaryRows }),
            new Paragraph({ spacing: { after: 300 } }),
            new Paragraph({
              children: [new TextRun({ text: "Thống kê theo từng Câu hỏi", bold: true })],
              spacing: { after: 200 },
            }),
            new DocxTable({ width: { size: 100, type: "pct" }, rows: questionRows }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Bao_cao_khao_sat_${name || ""}.docx`)
  }

  if (!input) return null

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
      title={
        <div className="flex items-center gap-2 mr-6">
          <span className="flex-1">Xem trước báo cáo khảo sát</span>
          <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? "Xong" : "Chỉnh sửa"}
          </Button>
          <Button size="small" icon={<FileWordOutlined />} onClick={exportWord}>
            Xuất Word
          </Button>
          <Button size="small" icon={<FileExcelOutlined />} onClick={exportExcel}>
            Xuất Excel
          </Button>
          <Button type="primary" size="small" icon={<PrinterOutlined />} onClick={handlePrint}>
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="p-2">
        {/* Tiêu đề */}
        <div className="font-bold text-lg text-center mb-4">
          {isEditing ? (
            <Input
              className="no-print text-center font-bold"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
          ) : (
            <span>BÁO CÁO KHẢO SÁT: {editedTitle}</span>
          )}
        </div>

        {/* Bảng thống kê theo từng câu hỏi */}
        <div className="font-bold mb-2">Thống kê theo từng Câu hỏi</div>
        <table
          className="mt-2 text-sm border-collapse border border-black text-center"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr className="font-bold text-center border border-black">
              <th className="border border-black text-center" style={{ width: 50 }}>
                STT
              </th>
              <th className="border border-black text-center" style={{ width: 90 }}>
                Câu hỏi
              </th>
              {editedQuestions[0]?.answers?.map((a: any) => (
                <th className="border border-black text-center" key={a.id}>
                  {a.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedQuestions.map((q: any, questionIdx: number) => {
              const percent = calculatePercent(q.answers)

              return (
                <tr key={q.id}>
                  <td className="text-center border border-black">{questionIdx + 1}</td>
                  <td className="text-center border border-black">{`Câu ${questionIdx + 1}`}</td>
                  {q.answers.map((a: any) => {
                    const p = percent.find((x) => x.id === a.id)
                    return (
                      <td key={a.id} className="text-center border border-black">
                        {isEditing ? (
                          <div className="no-print flex flex-col items-center gap-1">
                            <InputNumber
                              min={0}
                              size="small"
                              value={a.count}
                              onChange={(val) => updateAnswerCount(questionIdx, a.id, val ?? 0)}
                            />
                            <span className="text-xs text-gray-500">
                              {p?.percent ?? 0}% /{p?.total ?? 0}
                            </span>
                          </div>
                        ) : (
                          `${p?.percent ?? 0}% (${p?.count ?? 0}/${p?.total ?? 0})`
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Biểu đồ */}
        <div className="mt-6">
          <ReactECharts
            option={input.chartOption}
            style={{
              height: Math.max(400, editedQuestions.length * 40 + 150),
            }}
          />
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintSurvey
