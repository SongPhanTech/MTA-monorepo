import {
  DownloadOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import {
  useGetSurveyObjectCount,
  useGetSurveyStatistics,
  useGetSurveyStatisticsToField,
} from "@workspace/libs/api/exam"
import { customExamFetch } from "@workspace/libs/api/custom-instance"
import { useQuery } from "@tanstack/react-query"
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from "@workspace/libs/api/schemas"
import { useFindUniqueSurvey } from "@workspace/db/hooks"
import { Button, Col, Dropdown, Empty, Row, Tag, Typography } from "antd"
import {
  AlignmentType,
  Document,
  Table as DocxTable,
  Packer,
  Paragraph,
  TableCell,
  TableRow,
  TabStopType,
  TableLayoutType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
// @ts-nocheck
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { useRouter } from "next/router"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import {
  buildSpecificChoiceMap,
  getSpecialChoiceLabel,
} from "@/utils/survey-specific-choice"
import { exportGraduateSurveyWord } from "@/utils/export-graduate-survey-word"

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
    queryKey: ["/api/survey/objects/count-by-major", id],
    queryFn: async () => {
      const res = await customExamFetch<any>(`/api/survey/objects/count-by-major?id=${id}`, {
        method: "GET",
      })
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
  const { onOpen: onOpenGraduateReport } = useDisclosure({
    tag: "ModalGraduateSurveyReport",
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
          data: dataMajorCount.map((i: any) => i.name),
        },
        series: [
          {
            name: "Đã làm",
            type: "bar",
            color: "#7F95C9",
            itemStyle: {
              borderRadius: 0,
            },
            data: dataMajorCount.map((i: any) => i.taken),
          },
          {
            name: "Tổng",
            type: "bar",
            color: "#5FAE8C",
            itemStyle: {
              borderRadius: 0,
            },
            data: dataMajorCount.map((i: any) => i.total),
          },
        ],
      }
    }
    return {}
  }, [dataMajorCount])

  const { data: dataLevel } = useGetSurveyStatisticsToField(selectedId as string)

  const { data: surveyDetail } = useFindUniqueSurvey(
    {
      where: { id: selectedId },
      include: {
        surveyTopic: true,
        surveyChoice: {
          orderBy: { answer: "asc" },
        },
        surveyQuestion: {
          include: {
            surveyQuestionGroup: true,
            specificChoice: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    },
    { enabled: !!selectedId }
  )

  const specificChoiceByQuestionId = useMemo(
    () => buildSpecificChoiceMap(surveyDetail?.surveyQuestion),
    [surveyDetail]
  )

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

  const exportTemplate = async (name: string) => {
    showSpinner()
    try {
      const res = await customExamFetch<any>(`/api/survey/${selectedId}/export-report-excel`, {
        method: "GET",
      })

      if (res.status && res.status !== 200) {
        let msg = "Lỗi khi tải file báo cáo Excel"
        try {
          const text = await (res.data as Blob).text()
          const json = JSON.parse(text)
          msg = json.message || msg
        } catch (e) {}
        throw new Error(msg)
      }

      const blob = (res.data as Blob) || (res as any as Blob)
      saveAs(blob, `Bao_cao_khao_sat_${name || ""}.xlsx`)
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
          isSpecial: !!specificChoiceByQuestionId[q.id]?.length,
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
                  render: (_, record) => (record.isGroup ? "" : record.questionIndex),
                },
                {
                  title: "Câu hỏi",
                  align: "center",
                  width: 120,
                  render: (_, record) => {
                    if (record.isGroup) return <strong>ĐGTB</strong>
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span>{`Câu hỏi ${record.questionIndex}`}</span>
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
                  title: "Nội dung",
                  align: "left",
                  render: (_, record) => {
                    return record.isGroup ? (
                      <strong>{record.groupName || "Nhóm câu hỏi"}</strong>
                    ) : (
                      <HtmlTruncate>{record?.name}</HtmlTruncate>
                    )
                  },
                },
                {
                  title: "Phương án trả lời",
                  align: "center",
                  children: answerHeaders.map((i: any, answerIndex: number) => ({
                    // Câu thường: giữ header chung (surveyChoice.description)
                    title: i?.description,
                    id: i?.id,
                    dataIndex: i?.id,
                    width: 140,
                    align: "center",
                    render: (__: any, record: any) => {
                      const count = calculatePercent(record?.answers || []).find(
                        (a) => a.id === i?.id
                      )
                      const percentText = count
                        ? `${count.percent || 0}% (${count.count || 0}/${count.total})`
                        : "0"

                      if (record.isGroup || !record.isSpecial) return percentText

                      // Câu đặc biệt: hiện nhãn specificChoice ngay trên ô % để tránh nhầm với header chung
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
                },
              ]
            : [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, record) => (record.isGroup ? "" : record.questionIndex),
                },
                {
                  title: "Câu hỏi",
                  align: "center",
                  render: (_, record) => {
                    if (record.isGroup) return <strong>ĐGTB</strong>
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span>{`Câu hỏi ${record.questionIndex}`}</span>
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
                  title: "Nội dung",
                  align: "left",
                  render: (_, record) => {
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

  const cleanText = (str?: string) =>
    (str || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim()

  const calcGroupAverage = (
    groupQuestions: any[],
    choiceOptions: Array<{ answer: string; description: string }>
  ) => {
    const acc = choiceOptions.map((c) => ({
      answer: String(c.answer),
      description: c.description || "",
      count: 0,
    }))

    let totalCount = 0

    groupQuestions.forEach((q: any) => {
      (q.answers || []).forEach((a: any) => {
        const match = acc.find((item) => String(item.answer) === String(a.answer))
        if (match) {
          const cnt = Number(a.count || 0)
          match.count += cnt
          totalCount += cnt
        }
      })
    })

    return acc.map((item) => {
      const percent =
        totalCount === 0 ? 0 : Number.parseFloat(((item.count / totalCount) * 100).toFixed(2))
      return {
        ...item,
        total: totalCount,
        percent,
      }
    })
  }
  const handleDirectGraduateWordExport = async () => {
    showSpinner()
    try {
      const res = await customExamFetch<any>(`/api/survey/${selectedId}/graduate-report-data`, {
        method: "GET",
      })
      const reportData = res?.data || res
      if (reportData && reportData.surveyInfo) {
        await exportGraduateSurveyWord(reportData)
      } else {
        throw new Error("Không thể lấy dữ liệu báo cáo")
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      hideSpinner()
    }
  }

const exportWordReport = async (
    name: string,
    dataTable: any,
    dataTableInfo: any,
    dataMajorCount: any
  ) => {
    showSpinner()
    try {
      const centerCell = (
        text = "",
        opts?: { bold?: boolean; width?: number; size?: number }
      ) =>
        new TableCell({
          ...(opts?.width ? { width: { size: opts.width, type: WidthType.DXA } } : {}),
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: opts?.bold, size: opts?.size ?? 21 })],
            }),
          ],
        })

      const contentCell = (
        text = "",
        opts?: { bold?: boolean; width?: number; size?: number }
      ) =>
        new TableCell({
          ...(opts?.width ? { width: { size: opts.width, type: WidthType.DXA } } : {}),
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: opts?.bold, size: opts?.size ?? 21 })],
            }),
          ],
        })

      const questionCell = (
        index: number | string,
        isSpecial: boolean,
        opts?: { width?: number; size?: number }
      ) => {
        if (isSpecial) {
          return new TableCell({
            ...(opts?.width ? { width: { size: opts.width, type: WidthType.DXA } } : {}),
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Câu hỏi ${index}`, size: opts?.size ?? 21 }),
                  new TextRun({ text: " *", bold: true, color: "FF0000", size: opts?.size ?? 21 }),
                ],
              }),
            ],
          })
        }
        return centerCell(`Câu hỏi ${index}`, opts)
      }

      const headerCell = (
        text: string,
        opts?: { rowSpan?: number; columnSpan?: number; width?: number; size?: number }
      ) =>
        new TableCell({
          ...(opts?.width ? { width: { size: opts.width, type: WidthType.DXA } } : {}),
          ...(opts?.rowSpan ? { rowSpan: opts.rowSpan } : {}),
          ...(opts?.columnSpan ? { columnSpan: opts.columnSpan } : {}),
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, size: opts?.size ?? 22 })],
            }),
          ],
        })

      const buildOptionsParagraphs = (
        options: Array<{ answer: string; description: string }>
      ) => {
        if (!options || options.length === 0) return []
        const paragraphs: Paragraph[] = []
        const chunkSize = 3
        for (let i = 0; i < options.length; i += chunkSize) {
          const chunk = options.slice(i, i + chunkSize)
          const children: TextRun[] = []
          chunk.forEach((opt, idx) => {
            if (idx > 0) {
              children.push(new TextRun("	"))
            }
            const desc = (opt.description || "").trim()
            const cleanDesc = desc.replace(new RegExp(`^${opt.answer}[.\\s]+`, "i"), "").trim()
            children.push(
              new TextRun({
                text: `${opt.answer}. ${cleanDesc || desc}`,
                bold: true,
                size: 24,
              })
            )
          })
          paragraphs.push(
            new Paragraph({
              indent: { left: 500 },
              tabStops: [
                { type: TabStopType.LEFT, position: 3500 },
                { type: TabStopType.LEFT, position: 6800 },
              ],
              spacing: { after: 60 },
              children,
            })
          )
        }
        return paragraphs
      }

      const buildQuestionTable = (
        groups: any[],
        options: Array<{ answer: string; description: string }>,
        isSpecialTable: boolean
      ) => {
        const numOptions = options.length || 5
        const totalOptionsWidth = 5250
        const choiceColWidth = Math.floor(totalOptionsWidth / numOptions)
        const totalChoiceWidth = choiceColWidth * numOptions
        const sttWidth = 550
        const questionWidth = 1100
        const contentWidth = 9650 - sttWidth - questionWidth - totalChoiceWidth
        const columnWidths = [
          sttWidth,
          questionWidth,
          contentWidth,
          ...Array(numOptions).fill(choiceColWidth),
        ]
        const tableWidth = sttWidth + questionWidth + contentWidth + totalChoiceWidth

        const headerRows = [
          new TableRow({
            children: [
              headerCell("STT", { width: sttWidth, rowSpan: 2 }),
              headerCell("Câu hỏi", { width: questionWidth, rowSpan: 2 }),
              headerCell("Nội dung", { width: contentWidth, rowSpan: 2 }),
              headerCell("Phương án trả lời", { width: totalChoiceWidth, columnSpan: numOptions }),
            ],
          }),
          new TableRow({
            children: options.map((opt, idx) =>
              headerCell(String(opt.answer ?? idx + 1), { width: choiceColWidth })
            ),
          }),
        ]

        const bodyRows: TableRow[] = []

        groups.forEach((group: any) => {
          const groupAvg = calcGroupAverage(group.questions, options)

          // ĐGTB Row
          bodyRows.push(
            new TableRow({
              children: [
                centerCell("", { width: sttWidth }),
                centerCell("ĐGTB", { width: questionWidth, bold: true }),
                contentCell(group.groupName || "Nhóm câu hỏi", { width: contentWidth, bold: true }),
                ...groupAvg.map((avg) => {
                  const percentText = `${avg.percent || 0}% (${avg.count || 0}/${avg.total || 0})`
                  return centerCell(percentText, { width: choiceColWidth })
                }),
              ],
            })
          )

          // Question Rows
          group.questions.forEach((q: any) => {
            const qPercents = calculatePercent(q.answers || [])
            bodyRows.push(
              new TableRow({
                children: [
                  centerCell(String(q.questionIndex), { width: sttWidth }),
                  questionCell(q.questionIndex, isSpecialTable || q.isSpecial, { width: questionWidth }),
                  contentCell(cleanText(q.name), { width: contentWidth }),
                  ...options.map((opt) => {
                    const match = qPercents.find(
                      (a: any) => String(a.answer) === String(opt.answer)
                    )
                    const percentText = match
                      ? `${match.percent || 0}% (${match.count || 0}/${match.total || 0})`
                      : "0% (0/0)"
                    return centerCell(percentText, { width: choiceColWidth })
                  }),
                ],
              })
            )
          })
        })

        return new DocxTable({
          layout: TableLayoutType.FIXED,
          width: { size: tableWidth, type: WidthType.DXA },
          columnWidths,
          rows: [...headerRows, ...bodyRows],
        })
      }

      const buildSection = (
        title: string,
        tData: any,
        majorName: string = "",
        majorOrg: string = ""
      ) => {
        const headerParagraphs = [
          new Paragraph({
            alignment: "center",
            children: [new TextRun({ text: `Tổng hợp số liệu: ${name || ""}`, bold: true, size: 28 })],
          }),
          ...(majorOrg
            ? [
                new Paragraph({
                  alignment: "center",
                  children: [
                    new TextRun({
                      text: majorOrg.toUpperCase(),
                      bold: true,
                      size: 26,
                    }),
                  ],
                }),
              ]
            : []),
          ...(majorName
            ? [
                new Paragraph({
                  alignment: "center",
                  children: [
                    new TextRun({
                      text: `CHUYÊN NGÀNH: ${majorName.toUpperCase()}`,
                      bold: true,
                      underline: {},
                      size: 26,
                    }),
                  ],
                }),
              ]
            : []),
        ]

        if (!tData || !Array.isArray(tData) || tData.length === 0) {
          return [
            ...headerParagraphs,
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [new TextRun({ text: "Không có dữ liệu thống kê", italics: true })],
            }),
          ]
        }

        // 1. Assign sequential questionIndex to all questions across groups
        let qIndex = 1
        const enrichedGroups = tData.map((group: any) => ({
          ...group,
          questions: (group.questions || []).map((q: any) => {
            const sc = specificChoiceByQuestionId[q.id] || q.specificChoice || []
            const isSpecial = Boolean(sc && sc.length > 0)
            return {
              ...q,
              questionIndex: qIndex++,
              isSpecial,
              specificChoice: sc,
            }
          }),
        }))

        // 2. Separate groups for Table 1 (normal) and Table 2 (special)
        const normalGroups: any[] = []
        const specialGroups: any[] = []

        enrichedGroups.forEach((group: any) => {
          const normalQs = group.questions.filter((q: any) => !q.isSpecial)
          const specialQs = group.questions.filter((q: any) => q.isSpecial)

          if (normalQs.length > 0) {
            normalGroups.push({
              ...group,
              questions: normalQs,
            })
          }
          if (specialQs.length > 0) {
            specialGroups.push({
              ...group,
              questions: specialQs,
            })
          }
        })

        // 3. Resolve options for normal questions
        let normalOptions: Array<{ answer: string; description: string }> = []
        if (surveyDetail?.surveyChoice?.length) {
          normalOptions = [...surveyDetail.surveyChoice]
            .sort((a, b) => Number(a.answer) - Number(b.answer))
            .map((c) => ({ answer: String(c.answer), description: c.description || "" }))
        } else {
          const rawHeaderItems =
            tData?.[0]?.answers || tData?.[0]?.questions?.[0]?.answers || []
          if (rawHeaderItems.length > 0) {
            normalOptions = rawHeaderItems.map((c: any, idx: number) => ({
              answer: String(c.answer ?? idx + 1),
              description: c.description || "",
            }))
          } else {
            normalOptions = [
              { answer: "1", description: "Rất không đồng ý" },
              { answer: "2", description: "Không đồng ý" },
              { answer: "3", description: "Phân vân" },
              { answer: "4", description: "Đồng ý" },
              { answer: "5", description: "Rất đồng ý" },
            ]
          }
        }

        // 4. Resolve options for special questions
        let specialOptions: Array<{ answer: string; description: string }> = []
        for (const g of specialGroups) {
          for (const q of g.questions) {
            if (q.specificChoice && q.specificChoice.length > 0) {
              specialOptions = [...q.specificChoice]
                .sort((a, b) => Number(a.answer) - Number(b.answer))
                .map((c: any) => ({
                  answer: String(c.answer),
                  description: c.description || "",
                }))
              break
            }
          }
          if (specialOptions.length > 0) break
        }
        if (!specialOptions.length) {
          specialOptions = [
            { answer: "1", description: "Rất không hài lòng" },
            { answer: "2", description: "Không hài lòng" },
            { answer: "3", description: "Phân vân" },
            { answer: "4", description: "Hài lòng" },
            { answer: "5", description: "Rất hài lòng" },
          ]
        }

        // 5. Titles
        const hasBothTables = normalGroups.length > 0 && specialGroups.length > 0
        const section1Prefix = hasBothTables ? "I. " : ""
        const topicName = surveyDetail?.surveyTopic?.name?.trim()
        const section1Title = `${section1Prefix}${topicName ? topicName.toUpperCase() : "NHẬN XÉT ĐÁNH GIÁ TOÀN KHÓA HỌC"}`

        const section2Prefix = hasBothTables ? "II. " : ""
        let section2Name = "CẢM NHẬN VỀ KẾT QUẢ ĐẠT ĐƯỢC"
        if (specialGroups.length === 1 && specialGroups[0].groupName) {
          const rawName = specialGroups[0].groupName.trim()
          if (/cảm nhận.*kq.*đạt được/i.test(rawName)) {
            section2Name = "CẢM NHẬN VỀ KẾT QUẢ ĐẠT ĐƯỢC"
          } else {
            section2Name = rawName.toUpperCase()
          }
        } else if (specialGroups.length > 1) {
          const matching = specialGroups.find((g) => /cảm nhận.*kq.*đạt được/i.test(g.groupName || ""))
          if (matching) {
            section2Name = "CẢM NHẬN VỀ KẾT QUẢ ĐẠT ĐƯỢC"
          } else {
            section2Name = "CÂU HỎI CÓ ĐÁP ÁN ĐẶC BIỆT"
          }
        }
        const section2Title = `${section2Prefix}${section2Name}`

        const children: (Paragraph | DocxTable)[] = [
          ...headerParagraphs,
        ]

        if (normalGroups.length > 0) {
          children.push(
            new Paragraph({ text: "" }),
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: section1Title,
                  bold: true,
                  size: 26,
                }),
              ],
            }),
            ...buildOptionsParagraphs(normalOptions),
            new Paragraph({ text: "" }),
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "Thống kê theo từng Câu hỏi",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            buildQuestionTable(normalGroups, normalOptions, false)
          )
        }

        if (specialGroups.length > 0) {
          children.push(
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: section2Title,
                  bold: true,
                  size: 26,
                }),
              ],
            }),
            ...buildOptionsParagraphs(specialOptions),
            new Paragraph({ text: "" }),
            buildQuestionTable(specialGroups, specialOptions, true)
          )
        }

        return children
      }

      const sections = []

      const pageProperties = {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1134,
            right: 1122,
          },
        },
      }

      const primaryMajor =
        (dataMajorCount || []).find((m: any) => m.name !== "Khác" && m.organization) ||
        (dataMajorCount || []).find((m: any) => m.name !== "Khác") ||
        (dataMajorCount || [])[0]

      sections.push({
        properties: pageProperties,
        children: buildSection(
          "Tổng hợp chung",
          dataTable,
          primaryMajor?.name || "",
          primaryMajor?.organization || ""
        ),
      })

      if (dataMajorCount && dataMajorCount.length > 0) {
        for (const major of dataMajorCount) {
          try {
            const res = await customExamFetch<any>(
              `/api/survey/${selectedId}/statistics-to-Field?majorName=${encodeURIComponent(major.name)}`,
              { method: "GET" }
            )
            const tData = res?.data?.data || res?.data || res
            if (tData) {
              sections.push({
                properties: pageProperties,
                children: buildSection(`CN ${major.name}`, tData, major.name, major.organization),
              })
            }
          } catch (e) {
            console.error(e)
          }
        }
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Times New Roman",
                size: 24,
              },
            },
          },
        },
        sections,
      })
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
                  scroll={{ y: 400 }}
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
                            questions: allQuestions.map((q: any, index: number) => ({
                              ...q,
                              questionNumber: index + 1,
                              specificChoice: specificChoiceByQuestionId[q.id] || [],
                            })),
                            summaryInfo: data?.data,
                            chartOption: dataBarchart,
                          }),
                      },
                      {
                        key: "word",
                        label: "Xuất Word",
                        icon: <FileWordOutlined />,
                        children: [
                          {
                            key: "word-detailed",
                            label: "Báo cáo thống kê chi tiết theo câu hỏi (Mẫu hiện tại)",
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
                            key: "word-graduate",
                            label: "Báo cáo kết quả lấy ý kiến phản hồi từ học viên tốt nghiệp",
                            icon: <FileWordOutlined />,
                            children: [
                              {
                                key: "word-graduate-direct",
                                label: "Xuất báo cáo tự động (Word)",
                                icon: <DownloadOutlined />,
                                onClick: () => handleDirectGraduateWordExport(),
                              },
                              {
                                key: "word-graduate-modal",
                                label: "Kiểm tra, chỉnh sửa và xuất báo cáo",
                                icon: <FileWordOutlined />,
                                onClick: () =>
                                  onOpenGraduateReport({
                                    selectedId,
                                  }),
                              },
                            ],
                          },
                        ],
                      },
                      {
                        key: "excel",
                        label: "Xuất Excel",
                        icon: <FileExcelOutlined />,
                        onClick: () => exportTemplate(dataLevel?.data?.surveyName),
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
