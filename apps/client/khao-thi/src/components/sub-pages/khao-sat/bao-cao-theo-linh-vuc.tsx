import {
  DownloadOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import { useGetSurveyStatisticsToField } from "@workspace/libs/api/exam"
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from "@workspace/libs/api/schemas"
import { Button, Col, Dropdown, Empty, Row, Typography } from "antd"
import { Document, Table as DocxTable, Packer, Paragraph, TableCell, TableRow, TextRun } from "docx"
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title } = Typography

export interface CriteriaItem {
  id: string
  name: string
  answers: GetSurveyStatistics200QuestionsItemAnswersItem[]
}
type AnswerItem = {
  id: string
  answer: string
  description: string
  count: number
}

type AnswerWithPercent = AnswerItem & { percent: number; total: number }
function SurveyToFieldReport({ selectedId }: { selectedId: string }) {
  const { onOpen } = useDisclosure({
    tag: "ModalPrintSurveyToFieldReport",
  })

  const { data: dataLevel } = useGetSurveyStatisticsToField(selectedId as string)

  function convertToStackChartData(data: any[]) {
    const color = ["#D46A6A", "#E2A4A4", "#E6CF7A", "#7F95C9", "#5FAE8C"]
    const categories = data.map((item) => item.groupName)

    const series = data[0]?.answers.map((i: any, index: number) => ({
      name: i?.description,
      type: "bar" as const,
      stack: "total",
      label: {
        show: true,
        formatter: "{c}",
      },
      data: data.map((item) => {
        const found = item.answers.find((a: any) => a?.answer === i?.answer)
        return found ? found.count : 0
      }),
      itemStyle: { color: color[index] },
    }))

    return { categories, series }
  }
  const dataBarchart = useMemo(() => {
    let label: string[] = []
    if (dataLevel?.status === 200 && dataLevel?.data?.data?.length) {
      label = dataLevel?.data?.data?.map((_item: any, index: number) => `Lĩnh vực ${index + 1}`)
      const { series } = convertToStackChartData(dataLevel?.data?.data)
      return {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {},
        xAxis: {
          type: "value",
        },
        yAxis: {
          type: "category",
          data: label,
          inverse: true,
          axisLabel: {
            width: 240,
            overflow: "break",
            lineHeight: 16,
          },
        },
        series: series,
      }
    }
    return {}
  }, [dataLevel])

  const exportTemplate = async (name: string, dataTableInfo: any) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("BaoCaoKhaoSat")

    const golbalFontStyle = {
      name: "Times New Roman",
    }

    const headerTitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 14 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }

    const headerSubtitleStyle = {
      font: { ...golbalFontStyle, bold: true, size: 16 },
      alignment: {
        horizontal: "center" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }
    const headerSubtitleStyle1 = {
      font: { ...golbalFontStyle, bold: true, size: 16 },
      alignment: {
        horizontal: "left" as const,
        vertical: "middle" as const,
        wrapText: true as const,
      },
    }
    const tableHeaderStyle = {
      font: {
        ...golbalFontStyle,
        bold: true,
        size: 14,
        color: { argb: "FF000000" },
      },
      fill: {
        type: "pattern",
        pattern: "none",
      },
      alignment: {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      },
      border: {
        top: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        left: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        right: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
        bottom: {
          style: "thin" as ExcelJS.BorderStyle,
          color: { argb: "FF000000" },
        },
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

    let rowIndex = 7

    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Thống kê theo từng Lĩnh vực"
    worksheet.getCell(`A${rowIndex}`).style = headerSubtitleStyle1

    const headerRow = worksheet.getRow(rowIndex + 2)
    headerRow.values = dataTableInfo[0]?.answers?.length
      ? [
          "STT",
          "Lĩnh vực",
          "Tên Lĩnh vực",
          // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
          ...dataTableInfo[0]?.answers?.map((i: any) => i?.description),
        ]
      : ["STT", "Lĩnh vực", "Nội dung lĩnh vực"]
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
    if (dataTableInfo?.length > 0) {
      dataTableInfo.forEach((i: any, index: number) => {
        const headerRowValue: any = worksheet.getRow(rowIndex + 3 + index)
        headerRowValue.values = [
          index + 1,
          `Lĩnh vực ${index + 1}`,
          i?.groupName,
          ...calculatePercent(i?.answers).map(
            (a: any) => `${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`
          ),
        ]
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Bao_cao_khao_sat_theo_linh_vuc_${name || ""}.xlsx`)
  }

  function calculatePercent(items: AnswerItem[]): AnswerWithPercent[] {
    const total = items.reduce((sum, item) => sum + item.count, 0)
    return items.map((item) => ({
      ...item,
      total,
      percent: total === 0 ? 0 : Number.parseFloat(((item.count / total) * 100).toFixed(2)),
    }))
  }

  const renderTable = (dataTable: any) => {
    if (!dataTable?.length) return
    let average = dataTable[0]?.answers.map((i: any) => {
      return { ...i, total: 0, count: 0 }
    })
    dataTable.forEach((e: any) => {
      average = average.map((i: any) => {
        return {
          ...i,
          total: i.total + e.answers.find((a: any) => a.id === i.id)?.total,
          count: i.count + e.answers.find((a: any) => a.id === i.id)?.count,
        }
      })
    })
    const datarender = [
      ...dataTable,
      {
        name: "Trung bình",
        answers: average,
        id: "average",
      },
    ]
    return (
      <Table
        columns={
          dataTable?.length > 0
            ? [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Lĩnh vực",
                  align: "center",
                  width: 100,
                  render: (_, record, index) => {
                    return index === datarender.length - 1 ? "ĐGTB" : `Lĩnh vực ${index + 1}`
                  },
                },
                {
                  title: "Nội dung Lĩnh vực",
                  align: "left",
                  render: (_, record, index) => {
                    return index === datarender.length - 1 ? (
                      ""
                    ) : (
                      <HtmlTruncate>{record?.groupName}</HtmlTruncate>
                    )
                  },
                },
                // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                ...dataTable[0]?.answers?.map((i: any) => ({
                  title: i?.description,
                  id: i?.id,
                  dataIndex: i?.id,
                  width: 130,
                  align: "center",
                  render: (__: any, record: any) => {
                    const count = calculatePercent(record?.answers).find((a) => a.id === i?.id)

                    return `${count?.percent || 0}% (${count?.count || 0}/${count?.total})` || "0"
                  },
                })),
              ]
            : [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Lĩnh vực",
                  align: "center",
                  render: (_, record, index) => {
                    return `Lĩnh vực ${index + 1}`
                  },
                },
              ]
        }
        dataSource={dataTable}
        pagination={false}
      />
    )
  }
  const exportWordReport = async (name: string, dataTable: any) => {
    const centerCell = (text = "") =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: "center",
            children: [new TextRun(text)],
          }),
        ],
      })
    const answerHeaders = dataTable?.[0]?.answers?.map((a: any) => a.description) || []

    const questionRows = [
      new TableRow({
        children: [
          centerCell("STT"),
          centerCell("Lĩnh vực"),

          ...answerHeaders.map(centerCell),
        ],
      }),
      ...dataTable.map((q: any, idx: number) => {
        const percentData = calculatePercent(q.answers)
        return new TableRow({
          children: [
            centerCell(String(idx + 1)),
            centerCell(`Lĩnh vực ${idx + 1}`),
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
                new TextRun({
                  text: `BÁO CÁO KHẢO SÁT: ${name || ""}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),

            new Paragraph({ spacing: { after: 300 } }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Thống kê theo từng Lĩnh vực",
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            new DocxTable({
              width: { size: 100, type: "pct" },
              rows: questionRows,
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Bao_cao_khao_sat_${name || ""}.docx`)
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <div className="bg-white h-full flex flex-col">
            <div className="p-4 flex justify-between">
              <Title level={4}>Thống kê theo từng Lĩnh vực</Title>
              {dataLevel?.status === 200 && (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "print",
                        label: "In báo cáo",
                        icon: <PrinterOutlined />,
                        onClick: () =>
                          onOpen({
                            surveyName: dataLevel?.data?.surveyName,
                            fields: dataLevel?.data?.data,
                            chartOption: dataBarchart,
                          }),
                      },
                      {
                        key: "word",
                        label: "Xuất Word",
                        icon: <FileWordOutlined />,
                        onClick: () =>
                          exportWordReport(dataLevel?.data?.surveyName, dataLevel?.data?.data),
                      },
                      {
                        key: "excel",
                        label: "Xuất Excel",
                        icon: <FileExcelOutlined />,
                        onClick: () =>
                          exportTemplate(dataLevel?.data?.surveyName, dataLevel?.data?.data),
                      },
                    ],
                  }}
                >
                  <Button size="small" type="primary" icon={<DownloadOutlined />}>
                    Xuất dữ liệu
                  </Button>
                </Dropdown>
              )}
            </div>
            <div className="flex-1 mb-6">
              {dataLevel?.status === 200 && dataLevel?.data?.data?.length > 0 ? (
                <div style={{ width: "100%", height: "100%" }}>
                  <ReactECharts option={dataBarchart} className="w-full min-h-[400px]" />
                  {dataLevel?.data?.data?.length > 0 && renderTable(dataLevel?.data?.data)}
                </div>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default SurveyToFieldReport
