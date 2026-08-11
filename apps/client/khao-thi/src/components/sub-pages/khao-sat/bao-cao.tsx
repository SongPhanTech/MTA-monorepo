import {
  DownloadOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useGetSurveyObjectCount, useGetSurveyStatistics, useGetSurveyStatisticsToField } from "@workspace/libs/api/exam"
import { customExamFetch } from "@workspace/libs/api/custom-instance"
import { useQuery } from "@tanstack/react-query"
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from "@workspace/libs/api/schemas"
import { Button, Col, Dropdown, Empty, Row, Typography } from "antd"
import { Document, Table as DocxTable, Packer, Paragraph, TableCell, TableRow, TextRun } from "docx"
// @ts-nocheck
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
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

export const useGetSurveyMajorCount = (id: string) => {
  return useQuery({
    queryKey: ['/api/survey/objects/count-by-major', id],
    queryFn: async () => {
      const res = await customExamFetch<any>(`/api/survey/objects/count-by-major?id=${id}`, { method: 'GET' })
      return res?.data || res
    },
    enabled: !!id,
  })
}

function SurveyReport({ selectedId }: { selectedId: string }) {
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const { onOpen } = useDisclosure({
    tag: "ModalPrintSurvey",
  })
  const { data } = useGetSurveyObjectCount({
    id: selectedId as string,
  })
  
  const { data: dataMajorCount } = useGetSurveyMajorCount(selectedId as string)

  const dataInfo = useMemo(() => {
    if (data?.status === 200 && data?.data?.length) {
      return {
        title: {
          text: "World Population",
          show: false,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {},
        xAxis: {
          type: "value",
          boundaryGap: [0, 0.01],
        },
        yAxis: {
          type: "category",
          data: data?.data.map((i) => i.name),
        },
        series: [
          {
            name: "Đã làm",
            type: "bar",
            color: "#7F95C9",
            itemStyle: {
              borderRadius: 0,
            },
            data: data?.data.map((i) => i.taken),
          },
          {
            name: "Tổng",
            type: "bar",
            color: "#5FAE8C",
            itemStyle: {
              borderRadius: 0,
            },
            data: data?.data.map((i) => i.total),
          },
        ],
      }
    }
    return {}
  }, [data])

  const dataInfoMajor = useMemo(() => {
    if (dataMajorCount?.length) {
      return {
        title: {
          text: "Chuyên ngành",
          show: false,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {},
        xAxis: {
          type: "value",
          boundaryGap: [0, 0.01],
        },
        yAxis: {
          type: "category",
          data: dataMajorCount.map((i:any) => i.name),
        },
        series: [
          {
            name: "Đã làm",
            type: "bar",
            color: "#7F95C9",
            itemStyle: {
              borderRadius: 0,
            },
            data: dataMajorCount.map((i:any) => i.taken),
          },
          {
            name: "Tổng",
            type: "bar",
            color: "#5FAE8C",
            itemStyle: {
              borderRadius: 0,
            },
            data: dataMajorCount.map((i:any) => i.total),
          },
        ],
      }
    }
    return {}
  }, [dataMajorCount])

  const { data: dataLevel } = useGetSurveyStatisticsToField(selectedId as string)

  const allQuestions = useMemo(() => {
    if (dataLevel?.status === 200) {
      return (dataLevel.data as any).data?.flatMap((group: any) => group.questions) || []
    }
    return []
  }, [dataLevel])

  function convertToStackChartData(
    data: CriteriaItem[],
    answerDescriptions: GetSurveyStatistics200QuestionsItemAnswersItem[]
  ) {
    const color = ["#D46A6A", "#E2A4A4", "#E6CF7A", "#7F95C9", "#5FAE8C"]
    const answerMap: Record<string, string> = {}
    answerDescriptions.forEach((a) => {
      answerMap[a.answer] = a.description as string
    })

    const answerKeys = answerDescriptions.map((a) => a.answer).sort((a, b) => Number(a) - Number(b))

    const categories = data.map((item) => item.name)

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
    if (dataLevel?.status === 200 && allQuestions.length) {
      label = allQuestions.map((_item: any, index: number) => `Câu hỏi ${index + 1}`)
      const { series } = convertToStackChartData(
        allQuestions as any,
        allQuestions[0]?.answers as any
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

  const exportTemplate = async (name: string, dataTable: any, dataTableInfo: any, dataMajorCount: any) => {
    showSpinner()
    try {
      const workbook = new ExcelJS.Workbook()
      
      const golbalFontStyle = { name: "Times New Roman" }
      const headerTitleStyle = {
        font: { ...golbalFontStyle, bold: true, size: 14 },
        alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true as const },
      }
      const headerSubtitleStyle = {
        font: { ...golbalFontStyle, bold: true, size: 16 },
        alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true as const },
      }
      const headerSubtitleStyle1 = {
        font: { ...golbalFontStyle, bold: true, size: 16 },
        alignment: { horizontal: "left" as const, vertical: "middle" as const, wrapText: true as const },
      }
      const tableHeaderStyle = {
        font: { ...golbalFontStyle, bold: true, size: 14, color: { argb: "FF000000" } },
        fill: { type: "pattern", pattern: "none" },
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
        border: {
          top: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          left: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          right: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          bottom: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
        },
      }

      const generateSheet = (sheetName: string, tData: any, majorName: string = "", majorOrg: any = "") => {
        const worksheet = workbook.addWorksheet(sheetName.substring(0, 31).replace(/[\*\?\:\[\]\\\/]/g, ''))

        const titleStyle = {
          font: { name: "Times New Roman", bold: true, size: 14 },
          alignment: { horizontal: "left" as const, vertical: "middle" as const, wrapText: true as const },
        }

        const centerBoldStyle = {
          font: { name: "Times New Roman", bold: true, size: 12 },
          alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true as const },
        }

        const answerHeaders = tData?.[0]?.answers || tData?.[0]?.questions?.[0]?.answers || []
        const numAnswers = answerHeaders.length || 5

        worksheet.columns = [
          { width: 60 },
          ...Array.from({ length: numAnswers * 2 }).map(() => ({ width: 15 }))
        ]

        const lastCol = 1 + numAnswers * 2
        const lastColLetter = worksheet.getColumn(lastCol).letter

        let rowIndex = 1
        
        // Row 1: Title
        worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
        worksheet.getCell(`A${rowIndex}`).value = `BẢNG TỔNG HỢP PHIẾU LẤY Ý KIẾN HỌC VIÊN TỐT NGHIỆP`
        worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
        rowIndex++

        // Row 2: Faculty
        let orgString = "VIỆN CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG"
        if (typeof majorOrg === 'string' && majorOrg) {
          orgString = majorOrg
        } else if (majorOrg && typeof majorOrg === 'object') {
          orgString = majorOrg.sTen || majorOrg.name || orgString
        }
        worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
        worksheet.getCell(`A${rowIndex}`).value = majorName ? `KHOA/ĐƠN VỊ: ${orgString.toUpperCase()}` : "TỔNG HỢP CHUNG TOÀN HỌC VIỆN"
        worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
        rowIndex++

        // Row 3: Major
        worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
        worksheet.getCell(`A${rowIndex}`).value = majorName ? `CHUYÊN NGÀNH: ${majorName.toUpperCase()}` : ""
        worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
        rowIndex++
        
        rowIndex++ // Empty row
        
        if (tData?.length > 0) {
          tData.forEach((group: any, gIndex: number) => {
            const romanize = (num: number) => {
              const lookup: any = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1}
              let roman = ''
              for (const i in lookup) {
                while ( num >= lookup[i] ) { roman += i; num -= lookup[i] }
              }
              return roman
            }
            
            const groupTitle = `${romanize(gIndex + 1)}. ${group.groupName || "NHẬN XÉT ĐÁNH GIÁ"}`.toUpperCase()
            
            worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
            worksheet.getCell(`A${rowIndex}`).value = groupTitle
            worksheet.getCell(`A${rowIndex}`).style = { 
               font: { name: "Times New Roman", bold: true, italic: true, size: 12 },
               alignment: { horizontal: "left" as const, vertical: "middle" as const }
            }
            rowIndex++

            const currentAnswerHeaders = group.questions?.[0]?.answers || answerHeaders
            
            if (currentAnswerHeaders.length > 0) {
              const legendText = currentAnswerHeaders.map((a: any, idx: number) => `${idx + 1}. ${a.description}`).join("          ")
              worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
              worksheet.getCell(`A${rowIndex}`).value = legendText
              worksheet.getCell(`A${rowIndex}`).style = { font: { name: "Times New Roman", size: 11 }, alignment: { horizontal: "left" as const, wrapText: true as const } }
              rowIndex++
            }
            
            rowIndex++ // Blank row

            const headerRow1 = rowIndex
            worksheet.mergeCells(`A${headerRow1}:A${headerRow1 + 1}`)
            worksheet.getCell(`A${headerRow1}`).value = "Nội dung đánh giá"
            
            if (numAnswers > 0) {
              worksheet.mergeCells(headerRow1, 2, headerRow1, 1 + numAnswers)
              worksheet.getCell(headerRow1, 2).value = "Phương án trả lời"
              
              worksheet.mergeCells(headerRow1, 2 + numAnswers, headerRow1, 1 + numAnswers * 2)
              worksheet.getCell(headerRow1, 2 + numAnswers).value = "% trả lời"
              
              const headerRow2 = rowIndex + 1
              for (let i = 0; i < numAnswers; i++) {
                worksheet.getCell(headerRow2, 2 + i).value = i + 1
                worksheet.getCell(headerRow2, 2 + numAnswers + i).value = i + 1
              }
            }
            
            for (let r = headerRow1; r <= headerRow1 + 1; r++) {
               for (let c = 1; c <= 1 + numAnswers * 2; c++) {
                 const cell = worksheet.getCell(r, c)
                 cell.style = { ...centerBoldStyle, border: tableHeaderStyle.border }
               }
            }
            
            rowIndex += 2
            
            let qIndex = 1
            group.questions?.forEach((q: any) => {
               const rowValues: any[] = []
               rowValues.push(`${qIndex}. ${q.name || ""}`)
               
               let total = 0
               for (let i = 0; i < numAnswers; i++) {
                 const count = Number(q.answers?.[i]?.count || 0)
                 rowValues.push(count)
                 total += count
               }
               
               const row = worksheet.getRow(rowIndex)
               row.values = rowValues
               
               if (numAnswers > 0) {
                 const colStart = worksheet.getColumn(2).letter
                 const colEnd = worksheet.getColumn(1 + numAnswers).letter
                 
                 for (let i = 0; i < numAnswers; i++) {
                   const currCol = worksheet.getColumn(2 + i).letter
                   row.getCell(2 + numAnswers + i).value = {
                     formula: `IFERROR(${currCol}${rowIndex}/SUM(${colStart}${rowIndex}:${colEnd}${rowIndex})*100, 0)`
                   } as any
                 }
               }
               
               for (let c = 1; c <= 1 + numAnswers * 2; c++) {
                 const cell = row.getCell(c)
                 cell.border = tableHeaderStyle.border
                 cell.font = { name: "Times New Roman", size: 11 }
                 if (c > 1) cell.alignment = { horizontal: "center" as const, vertical: "middle" as const }
                 else cell.alignment = { horizontal: "left" as const, vertical: "middle" as const, wrapText: true as const }
               }
               
               rowIndex++
               qIndex++
            })
            rowIndex++ 
          })
        }
      }

      generateSheet("Tổng hợp chung", dataTable)

      if (dataMajorCount && dataMajorCount.length > 0) {
        for (const major of dataMajorCount) {
          try {
            const res = await customExamFetch<any>(`/api/survey/${selectedId}/statistics-to-Field?majorName=${encodeURIComponent(major.name)}`, { method: 'GET' })
            const tData = res?.data?.data || res?.data || res
            if (tData) {
               generateSheet(`CN ${major.name}`, tData, major.name, major.organization)
            }
          } catch(e) {
            console.error(e)
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), `Bao_cao_khao_sat_${name || ""}.xlsx`)
    } catch (e) {
      console.error(e)
    } finally {
      hideSpinner()
    }
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

    const flatData: any[] = []
    let questionIndex = 1
    dataTable.forEach((group: any) => {
      flatData.push({
        ...group,
        isGroup: true,
        rowKey: `group-${group.groupId || Math.random()}`,
      })
      group.questions?.forEach((q: any) => {
        flatData.push({
          ...q,
          isGroup: false,
          questionIndex: questionIndex++,
          rowKey: `question-${q.id}`,
        })
      })
    })

    const answerHeaders = dataTable[0]?.answers || dataTable[0]?.questions?.[0]?.answers || []

    return (
      <Table
        rowKey="rowKey"
        columns={
          answerHeaders?.length > 0
            ? [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, record: any) => (record.isGroup ? "" : record.questionIndex),
                },
                {
                  title: "Câu hỏi",
                  align: "center",
                  width: 100,
                  render: (_, record: any) => {
                    return record.isGroup ? <strong>ĐGTB</strong> : `Câu hỏi ${record.questionIndex}`
                  },
                },
                {
                  title: "Nội dung",
                  align: "left",
                  render: (_, record: any) => {
                    return record.isGroup ? (
                      <strong>{record.groupName || "Nhóm câu hỏi"}</strong>
                    ) : (
                      <HtmlTruncate>{record?.name}</HtmlTruncate>
                    )
                  },
                },
                ...answerHeaders.map((i: any) => ({
                  title: i?.description,
                  id: i?.id,
                  dataIndex: i?.id,
                  width: 130,
                  align: "center",
                  render: (__: any, record: any) => {
                    const count = calculatePercent(record?.answers || []).find((a) => a.id === i?.id)
                    return count ? `${count.percent || 0}% (${count.count || 0}/${count.total})` : "0"
                  },
                })),
              ]
            : [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, record: any) => (record.isGroup ? "" : record.questionIndex),
                },
                {
                  title: "Câu hỏi",
                  align: "center",
                  render: (_, record: any) => {
                    return record.isGroup ? <strong>ĐGTB</strong> : `Câu hỏi ${record.questionIndex}`
                  },
                },
                {
                  title: "Nội dung",
                  align: "left",
                  render: (_, record: any) => {
                    return record.isGroup ? (
                      <strong>{record.groupName || "Nhóm câu hỏi"}</strong>
                    ) : (
                      <HtmlTruncate>{record?.name}</HtmlTruncate>
                    )
                  },
                },
              ]
        }
        dataSource={flatData}
        pagination={false}
      />
    )
  }
  const exportWordReport = async (name: string, dataTable: any, dataTableInfo: any, dataMajorCount: any) => {
    showSpinner()
    try {
      const centerCell = (text = "") =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: "center",
              children: [new TextRun(text)],
            }),
          ],
        })

      const buildQuestionTable = (tData: any) => {
        const answerHeaders = tData?.[0]?.answers?.map((a: any) => a.description) 
          || tData?.[0]?.questions?.[0]?.answers?.map((a: any) => a.description) 
          || []

        const answerRows: any[] = []
        if (tData?.length > 0) {
          const flatData: any[] = []
          let qIndex = 1
          tData.forEach((group: any) => {
            flatData.push({ ...group, isGroup: true })
            group.questions?.forEach((q: any) => {
              flatData.push({ ...q, isGroup: false, questionIndex: qIndex++ })
            })
          })

          flatData.forEach((i: any) => {
            const percents = calculatePercent(i?.answers || [])
            answerRows.push(
              new TableRow({
                children: [
                  centerCell(i.isGroup ? "" : String(i.questionIndex)),
                  centerCell(i.isGroup ? "ĐGTB" : `Câu hỏi ${i.questionIndex}`),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: (i.isGroup ? i.groupName : i?.name) || "", bold: i.isGroup })] })],
                  }),
                  ...percents.map((a: any) => centerCell(`${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`)),
                ],
              })
            )
          })
        }

        return new DocxTable({
          width: { size: 100, type: "pct" },
          rows: [
            new TableRow({
              children: [
                centerCell("STT"),
                centerCell("Câu hỏi"),
                centerCell("Nội dung"),
                ...answerHeaders.map((h: string) => centerCell(h)),
              ],
            }),
            ...answerRows,
          ],
        })
      }

      const buildSection = (title: string, tData: any, majorName: string = "", majorOrg: string = "") => {
        return [
          new Paragraph({
            alignment: "center",
            children: [
              new TextRun({ text: majorName ? `CHUYÊN NGÀNH HỌC: ${majorName}`: "", bold: true, underline: majorName ? {} : undefined }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: "center",
            children: [
              new TextRun({ text: `Báo cáo khảo sát: ${name}`, bold: true, size: 28 }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "Thống kê theo từng Câu hỏi", bold: true, size: 24 })],
          }),
          buildQuestionTable(tData)
        ]
      }

      const sections = []
      
      sections.push({
        properties: {},
        children: buildSection("Tổng hợp chung", dataTable)
      })

      if (dataMajorCount && dataMajorCount.length > 0) {
        for (const major of dataMajorCount) {
          try {
            const res = await customExamFetch<any>(`/api/survey/${selectedId}/statistics-to-Field?majorName=${encodeURIComponent(major.name)}`, { method: 'GET' })
            const tData = res?.data?.data || res?.data || res
            if (tData) {
              sections.push({
                properties: {},
                children: buildSection(`CN ${major.name}`, tData, major.name, major.organization)
              })
            }
          } catch(e) {
             console.error(e)
          }
        }
      }

      const doc = new Document({ sections })
      const buffer = await Packer.toBlob(doc)
      saveAs(buffer, `Bao_cao_khao_sat_${name || ""}.docx`)
    } catch (e) {
      console.error(e)
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        {data?.status === 200 && data?.data?.length > 0 && (
          <Col span={24}>
            <div className="bg-white h-full flex flex-col">
              <div className="px-4 pb-4 flex justify-between">
                <Title level={4}>Thống kê chung</Title>
              </div>
              <div className="flex-1">
                <ReactECharts option={dataInfo} className="w-full min-h-[400px]" />
                <Table
                  columns={[
                    {
                      title: "STT",
                      width: 60,
                      align: "center",
                      fixed: "left",
                      render: (_, __, index) => index + 1,
                    },
                    {
                      title: "Đối tượng",
                      render: (_, record) => {
                        return record?.name
                      },
                    },
                    {
                      title: "Trạng thái",
                      align: "center",
                      width: 200,
                      render: (_, record) => {
                        return `${record?.taken || 0}/${record?.total || 0}`
                      },
                    },
                  ]}
                  dataSource={data?.data}
                  pagination={false}
                />
              </div>
            </div>
          </Col>
        )}

        {dataMajorCount && dataMajorCount.length > 0 && (
          <Col span={24}>
            <div className="bg-white h-full flex flex-col mt-4">
              <div className="px-4 pb-4 flex justify-between">
                <Title level={4}>Thống kê chuyên ngành</Title>
              </div>
              <div className="flex-1">
                <ReactECharts option={dataInfoMajor} className="w-full min-h-[400px]" />
                <Table
                  columns={[
                    {
                      title: "STT",
                      width: 60,
                      align: "center",
                      fixed: "left",
                      render: (_, __, index) => index + 1,
                    },
                    {
                      title: "Chuyên ngành",
                      render: (_, record) => record?.name,
                    },
                    {
                      title: "Trạng thái",
                      align: "center",
                      width: 200,
                      render: (_, record) => `${record?.taken || 0}/${record?.total || 0}`,
                    },
                  ]}
                  dataSource={dataMajorCount}
                  pagination={false}
                />
              </div>
            </div>
          </Col>
        )}

        <Col span={24}>
          <div className="bg-white h-full flex flex-col mt-4">
            <div className="p-4 flex justify-between">
              <Title level={4}>Thống kê theo từng Câu hỏi</Title>
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
                            questions: allQuestions,
                            summaryInfo: data?.data,
                            chartOption: dataBarchart,
                          }),
                      },
                      {
                        key: "word",
                        label: "Xuất Word",
                        icon: <FileWordOutlined />,
                        onClick: () =>
                          exportWordReport(
                            dataLevel?.data?.surveyName,
                            dataLevel?.data?.data,
                            data?.data,
                            dataMajorCount
                          ),
                      },
                      {
                        key: "excel",
                        label: "Xuất Excel",
                        icon: <FileExcelOutlined />,
                        onClick: () =>
                          exportTemplate(
                            dataLevel?.data?.surveyName,
                            dataLevel?.data?.data,
                            data?.data,
                            dataMajorCount
                          ),
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
                  {renderTable(dataLevel?.data?.data)}
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

export default SurveyReport
