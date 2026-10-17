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
  TextRun,
  VerticalAlign,
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
        surveyQuestion: {
          include: {
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

  const exportWordReport = async (
    name: string,
    dataTable: any,
    dataTableInfo: any,
    dataMajorCount: any
  ) => {
    showSpinner()
    try {
      const centerCell = (text = "") =>
        new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(text)],
            }),
          ],
        })
      const specialAnswerCell = (label: string, percentText: string) =>
        new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: label, bold: true, size: 18 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(percentText)],
            }),
          ],
        })
      const headerCell = (text: string, opts?: { rowSpan?: number; columnSpan?: number }) =>
        new TableCell({
          ...(opts?.rowSpan ? { rowSpan: opts.rowSpan } : {}),
          ...(opts?.columnSpan ? { columnSpan: opts.columnSpan } : {}),
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true })],
            }),
          ],
        })

      const buildQuestionTable = (tData: any) => {
        const answerHeaderItems =
          tData?.[0]?.answers || tData?.[0]?.questions?.[0]?.answers || []
        const answerHeaders = answerHeaderItems.map((a: any) => a.description)

        const answerRows: any[] = []
        if (tData?.length > 0) {
          const flatData: any[] = []
          let qIndex = 1
          tData.forEach((group: any) => {
            flatData.push({ ...group, isGroup: true })
            group.questions?.forEach((q: any) => {
              flatData.push({
                ...q,
                isGroup: false,
                isSpecial: !!specificChoiceByQuestionId[q.id]?.length,
                questionIndex: qIndex++,
              })
            })
          })

          flatData.forEach((i: any) => {
            const percents = calculatePercent(i?.answers || [])
            answerRows.push(
              new TableRow({
                children: [
                  centerCell(i.isGroup ? "" : String(i.questionIndex)),
                  i.isGroup
                    ? centerCell("ĐGTB")
                    : i.isSpecial
                      ? new TableCell({
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun(`Câu hỏi ${i.questionIndex}`),
                                new TextRun({ text: " *", bold: true, color: "FF0000" }),
                              ],
                            }),
                          ],
                        })
                      : centerCell(`Câu hỏi ${i.questionIndex}`),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (i.isGroup ? i.groupName : i?.name) || "",
                            bold: i.isGroup,
                          }),
                        ],
                      }),
                    ],
                  }),
                  ...percents.map((a: any, answerIndex: number) => {
                    const percentText = `${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`
                    if (i.isGroup || !i.isSpecial) return centerCell(percentText)

                    const specialLabel = getSpecialChoiceLabel(
                      specificChoiceByQuestionId[i.id],
                      answerIndex,
                      a?.answer
                    )
                    return specialLabel
                      ? specialAnswerCell(specialLabel, percentText)
                      : centerCell(percentText)
                  }),
                ],
              })
            )
          })
        }

        const headerRows =
          answerHeaders.length > 0
            ? [
                new TableRow({
                  children: [
                    headerCell("STT", { rowSpan: 2 }),
                    headerCell("Câu hỏi", { rowSpan: 2 }),
                    headerCell("Nội dung", { rowSpan: 2 }),
                    headerCell("Phương án trả lời", { columnSpan: answerHeaders.length }),
                  ],
                }),
                new TableRow({
                  children: answerHeaders.map((h: string) => headerCell(h || "")),
                }),
              ]
            : [
                new TableRow({
                  children: [headerCell("STT"), headerCell("Câu hỏi"), headerCell("Nội dung")],
                }),
              ]

        return new DocxTable({
          width: { size: 100, type: "pct" },
          rows: [...headerRows, ...answerRows],
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
            children: [new TextRun({ text: `Tổng hợp số liệu: ${name}`, bold: true, size: 28 })],
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

        return [
          ...headerParagraphs,
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "Thống kê theo từng Câu hỏi", bold: true, size: 24 })],
          }),
          buildQuestionTable(tData),
        ]
      }

      const sections = []

      const primaryMajor =
        (dataMajorCount || []).find((m: any) => m.name !== "Khác" && m.organization) ||
        (dataMajorCount || []).find((m: any) => m.name !== "Khác") ||
        (dataMajorCount || [])[0]

      sections.push({
        properties: {},
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
                properties: {},
                children: buildSection(`CN ${major.name}`, tData, major.name, major.organization),
              })
            }
          } catch (e) {
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
                            questions: allQuestions.map((q: any) => ({
                              ...q,
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
