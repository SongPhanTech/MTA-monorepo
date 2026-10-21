import {
  DownOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useFindUniqueClusterSurvey } from "@workspace/db/hooks"
import { useGetClusterSurveyStatisticsForLecturer } from "@workspace/libs/api/exam"
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from "@workspace/libs/api/schemas"
import { Button, Col, Dropdown, Empty, Row, Tag, Typography } from "antd"
// @ts-nocheck
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { exportSurveyDocxTemplate } from "@/utils/export-survey-docx-template"
import {
  buildSpecificChoiceMap,
  formatSpecialAnswerCell,
  getSpecialChoiceLabel,
} from "@/utils/survey-specific-choice"
import { useRouter } from "next/router"
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
function SurveylecturerReport({
  selectedId,
  lectureId,
  surveyName,
  trainingObjectTypeName,
  semesterName,
  trainingSystemName,
  organizationCode,
  organizationName,
  lecturerName,
  lecturerCode,
  departmentName,
  departmentCode,
  completed,
  total,
}: {
  selectedId: string
  lectureId: string
  surveyName: string
  trainingObjectTypeName?: string
  semesterName?: string
  trainingSystemName?: string
  organizationCode?: string
  organizationName?: string
  lecturerName?: string
  lecturerCode?: string
  departmentName?: string
  departmentCode?: string
  completed?: number
  total?: number
}) {
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const { onOpen } = useDisclosure({
    tag: "ModalPrintSurveylecturer",
  })
  const { data: dataLevel } = useGetClusterSurveyStatisticsForLecturer(selectedId as string, {
    lectureId,
  })

  const { data: clusterDetail } = useFindUniqueClusterSurvey(
    {
      where: { id: selectedId },
      include: {
        surveyQuestion: {
          include: {
            specificChoice: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    },
    { enabled: !!selectedId }
  )

  const specificChoiceByQuestionId = useMemo(
    () => buildSpecificChoiceMap(clusterDetail?.surveyQuestion),
    [clusterDetail]
  )

  const questionsWithSpecific = useMemo(() => {
    const questions =
      dataLevel?.status === 200 ? dataLevel.data.data?.questions || [] : []
    return questions.map((q: any) => ({
      ...q,
      specificChoice: specificChoiceByQuestionId[q.id] || [],
    }))
  }, [dataLevel, specificChoiceByQuestionId])
  function convertToStackChartData(
    data: CriteriaItem[],
    answerDescriptions: GetSurveyStatistics200QuestionsItemAnswersItem[]
  ) {
    // Map answer -> description
    const color = ["#dd0b31", "#ea8585", "#ffc769", "#4b50db", "#028850"]
    const answerMap: Record<string, string> = {}
    answerDescriptions.forEach((a) => {
      answerMap[a.answer] = a.description as string
    })

    // Các đáp án theo thứ tự tăng dần 1 → 5
    const answerKeys = answerDescriptions.map((a) => a.answer).sort((a, b) => Number(a) - Number(b))

    // Trục Y: danh sách Câu hỏi
    const categories = data.map((item) => item.name)

    // Series stack bar
    const series = answerKeys.map((answer, index: number) => ({
      name: answerMap[answer],
      type: "bar" as const,
      stack: "total",
      label: {
        show: true,
        formatter: "{c}",
      },
      data: data.map((item) => {
        const found = item.answers.find((a) => a.answer === answer)
        return found ? found.count : 0
      }),
      itemStyle: { color: color[index] },
    }))

    return { categories, series }
  }

  const dataBarchart = useMemo(() => {
    let label: string[] = []
    if (dataLevel?.status === 200 && dataLevel?.data?.data?.questions?.length) {
      label = dataLevel?.data?.data?.questions?.map((item, index) => `Câu hỏi ${index + 1}`)
      const { categories, series } = convertToStackChartData(
        dataLevel?.data?.data?.questions,
        dataLevel?.data?.data?.questions[0]?.answers
      )

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

  const exportTemplate = async (name: string, dataTable: any, dataTableInfo: any) => {
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("BaoCaoKhaoSat")

    // Thiết lập style
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

    const addBorderToRange = (
      sheet: ExcelJS.Worksheet,
      fromRow: number,
      toRow: number,
      toCol: number
    ) => {
      for (let row = fromRow; row <= toRow; row++) {
        for (let col = 1; col <= toCol; col++) {
          sheet.getCell(row, col).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "thin" },
          }
        }
      }
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
    worksheet.getCell("A4").value = `Báo cáo ${surveyName}`
    worksheet.getCell("A4").style = headerSubtitleStyle
    worksheet.getRow(4).height = 20

    let rowIndex = 11
    if (dataTableInfo?.length > 0) {
      worksheet.mergeCells("A7:C7")
      worksheet.getCell("A7").value = "Thông kê chung"
      worksheet.getCell("A7").style = headerSubtitleStyle1
      // Thông tin chung
      const headerRowInfo = worksheet.getRow(9)
      headerRowInfo.values = ["STT", "Đối tượng", "Trạng thái"]
      headerRowInfo.eachCell((cell: any) => {
        cell.style = tableHeaderStyle
      })

      dataTableInfo?.forEach((item: any, index: number) => {
        worksheet.getRow(index + 10).values = [
          index + 1,
          item?.name,
          `${item?.taken || 0}/${item?.total || 0}`,
        ]
      })

      rowIndex = 9 + dataTableInfo?.length + 3
    }

    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Thống kê theo từng Câu hỏi"
    worksheet.getCell(`A${rowIndex}`).style = headerSubtitleStyle1

    // Thêm tiêu đề bảng
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

    // Điều chỉnh độ rộng cột
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
    if (dataTable?.length > 0) {
      dataTable.forEach((i: any, index: number) => {
        const isSpecial = !!specificChoiceByQuestionId[i.id]?.length
        const headerRowValue: any = worksheet.getRow(rowIndex + 3 + index)
        if (isSpecial) headerRowValue.height = 36

        headerRowValue.getCell(1).value = index + 1
        if (isSpecial) {
          headerRowValue.getCell(2).value = {
            richText: [
              { text: `Câu hỏi ${index + 1}`, font: { name: "Times New Roman", size: 11 } },
              {
                text: " *",
                font: {
                  name: "Times New Roman",
                  size: 11,
                  bold: true,
                  color: { argb: "FFFF0000" },
                },
              },
            ],
          }
        } else {
          headerRowValue.getCell(2).value = `Câu hỏi ${index + 1}`
        }
        headerRowValue.getCell(3).value = i?.name

        calculatePercent(i?.answers).forEach((a: any, answerIndex: number) => {
          const percentText = `${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`
          const label = isSpecial
            ? getSpecialChoiceLabel(specificChoiceByQuestionId[i.id], answerIndex, a?.answer)
            : null
          headerRowValue.getCell(4 + answerIndex).value = formatSpecialAnswerCell(
            label,
            percentText
          )
        })

        headerRowValue.eachCell((cell: any, colNumber: number) => {
          cell.alignment = {
            horizontal: colNumber === 3 ? "left" : "center",
            vertical: "middle",
            wrapText: true,
          }
        })
      })
    }
    addBorderToRange(
      worksheet,
      rowIndex + 2,
      rowIndex + 2 + dataTable.length,
      worksheet.columns.length
    )
    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Bao_cao_khao_sat_${name || ""}.xlsx`)
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
      ...dataTable.map((q: any) => ({
        ...q,
        isSpecial: !!specificChoiceByQuestionId[q.id]?.length,
      })),
      {
        name: "Trung bình",
        answers: average,
        id: "average",
        isSpecial: false,
      },
    ]
    return (
      <Table
        rowKey={"id"}
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
                  title: "Câu hỏi",
                  align: "center",
                  width: 120,
                  render: (_, record, index) => {
                    if (index === datarender.length - 1) return "ĐGTB"
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span>{`Câu hỏi ${index + 1}`}</span>
                        {record.isSpecial && (
                          <Tag color="blue" className="m-0">
                            Đặc biệt
                          </Tag>
                        )}
                      </div>
                    )
                  },
                },
                {
                  title: "Nội dung câu hỏi",
                  align: "left",
                  render: (_, record, index) => {
                    return index === datarender.length - 1 ? (
                      ""
                    ) : (
                      <HtmlTruncate>{record?.name}</HtmlTruncate>
                    )
                  },
                },
                // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                ...dataTable[0]?.answers?.map((i: any, answerIndex: number) => ({
                  title: i?.description,
                  id: i?.id,
                  dataIndex: i?.id,
                  width: 140,
                  align: "center",
                  render: (__: any, record: any) => {
                    const count = calculatePercent(record?.answers).find((a) => a.id === i?.id)
                    const percentText =
                      `${count?.percent || 0}% (${count?.count || 0}/${count?.total})` || "0"

                    if (record.id === "average" || !record.isSpecial) return percentText

                    const specialLabel = getSpecialChoiceLabel(
                      specificChoiceByQuestionId[record.id],
                      answerIndex,
                      i?.answer
                    )
                    return (
                      <div className="leading-tight">
                        {specialLabel && (
                          <div className="mb-1 text-xs font-semibold text-[#1677ff]">
                            {specialLabel}
                          </div>
                        )}
                        <div>{percentText}</div>
                      </div>
                    )
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
                  title: "Câu hỏi",
                  align: "center",
                  render: (_, record, index) => {
                    return `Câu hỏi ${index + 1}`
                  },
                },
              ]
        }
        dataSource={datarender}
        pagination={false}
      />
    )
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <div className="bg-white h-full flex flex-col">
            <div className="p-4 flex justify-between">
              <div>
                <Title level={4}>Thống kê theo từng Câu hỏi</Title>
                <div className="text-gray-500 font-medium">
                  Số lượt tham gia khảo sát: <span className="text-primary">{completed || 0}</span>{" "}
                  / {total || 0}
                </div>
              </div>
              {dataLevel?.status === 200 && (
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "export",
                        icon: <FileExcelOutlined />,
                        label: "Xuất báo cáo",
                        onClick: () => {
                          exportTemplate(
                            surveyName,
                            questionsWithSpecific,
                            dataLevel?.data?.data
                          )
                        },
                      },
                      {
                        key: "export-docx",
                        icon: <FileWordOutlined />,
                        label: "Xuất Word",
                        onClick: async () => {
                          showSpinner()
                          try {
                            await exportSurveyDocxTemplate({
                              variant: "GIANG_VIEN",
                              surveyName,
                              trainingObjectTypeName,
                              semesterName,
                              trainingSystemName,
                              lecturerName,
                              lecturerCode,
                              departmentName,
                              departmentCode,
                              organizationName,
                              organizationCode,
                              questions: questionsWithSpecific,
                            })
                          } finally {
                            hideSpinner()
                          }
                        },
                      },
                      {
                        key: "print",
                        icon: <PrinterOutlined />,
                        label: "In báo cáo",
                        onClick: () => {
                          onOpen({
                            surveyName,
                            trainingObjectTypeName,
                            lecturerName,
                            lecturerCode,
                            departmentName,
                            departmentCode,
                            organizationName,
                            organizationCode,
                            questions: questionsWithSpecific,
                            chartOption: dataBarchart,
                          })
                        },
                      },
                    ],
                  }}
                >
                  <Button type="primary" size="small">
                    Xuất báo cáo <DownOutlined />
                  </Button>
                </Dropdown>
              )}
            </div>
            <div className="flex-1 mb-6">
              {dataLevel?.status === 200 && dataLevel?.data?.data?.questions?.length > 0 ? (
                <div style={{ width: "100%", height: "100%" }}>
                  <ReactECharts
                    option={dataBarchart}
                    style={{
                      width: "100%",
                      height: Math.max(
                        300,
                        (dataLevel?.data?.data?.questions?.length || 0) * 35 + 120
                      ),
                    }}
                  />
                  {dataLevel?.data?.data?.questions?.length > 0 &&
                    renderTable(dataLevel?.data?.data?.questions)}
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

export default SurveylecturerReport
