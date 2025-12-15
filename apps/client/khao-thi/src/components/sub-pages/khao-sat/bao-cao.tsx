import useSpinner from '@hooks/spinner'
import { useGetSurveyObjectCount, useGetSurveyStatistics } from '@workspace/libs/api/exam'
import { Button, Col, Empty, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
// @ts-nocheck
import ReactECharts from 'echarts-for-react'
import { GetSurveyStatistics200QuestionsItemAnswersItem } from '@workspace/libs/api/schemas'
import Table from '@components/commons/table'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import HtmlTruncate from '@components/commons/html-truncate'
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
function SurveyReport({ selectedId }: { selectedId: string }) {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useGetSurveyObjectCount({
        id: selectedId as string,
    })
    const dataInfo = useMemo(() => {
        if (data?.status === 200 && data?.data?.length) {
            return {
                title: {
                    text: 'World Population',
                    show: false,
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                },
                legend: {},
                xAxis: {
                    type: 'value',
                    boundaryGap: [0, 0.01],
                },
                yAxis: {
                    type: 'category',
                    data: data?.data.map((i) => i.name),
                },
                series: [
                    {
                        name: 'Đã làm',
                        type: 'bar',
                        data: data?.data.map((i) => i.taken),
                    },
                    {
                        name: 'Tổng',
                        type: 'bar',
                        data: data?.data.map((i) => i.total),
                    },
                ],
            }
        }
        return {}
    }, [data])

    const { data: dataLevel } = useGetSurveyStatistics(selectedId as string)
    function convertToStackChartData(
        data: CriteriaItem[],
        answerDescriptions: GetSurveyStatistics200QuestionsItemAnswersItem[]
    ) {
        // Map answer -> description
        const answerMap: Record<string, string> = {}
        answerDescriptions.forEach((a) => {
            answerMap[a.answer] = a.description as string
        })

        // Các đáp án theo thứ tự tăng dần 1 → 5
        const answerKeys = answerDescriptions
            .map((a) => a.answer)
            .sort((a, b) => Number(a) - Number(b))

        // Trục Y: danh sách Câu hỏi
        const categories = data.map((item) => item.name)

        // Series stack bar
        const series = answerKeys.map((answer) => ({
            name: answerMap[answer],
            type: 'bar' as const,
            stack: 'total',
            label: {
                show: true,
                formatter: '{c}',
            },
            data: data.map((item) => {
                const found = item.answers.find((a) => a.answer === answer)
                return found ? found.count : 0
            }),
        }))

        return { categories, series }
    }
    const dataBarchart = useMemo(() => {
        let label: string[] = []
        if (dataLevel?.status === 200 && dataLevel?.data?.questions?.length) {
            label = dataLevel?.data?.questions?.map((item, index) => `Câu hỏi ${index + 1}`)
            const { categories, series } = convertToStackChartData(
                dataLevel?.data?.questions,
                dataLevel?.data?.questions[0]?.answers
            )

            return {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        // Use axis to trigger tooltip
                        type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
                    },
                },
                legend: {},
                xAxis: {
                    type: 'value',
                },
                yAxis: {
                    type: 'category',
                    data: label,
                    inverse: true,
                    axisLabel: {
                        width: 240,
                        overflow: 'break',
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
        const worksheet = workbook.addWorksheet('BaoCaoKhaoSat')

        // Thiết lập style
        const golbalFontStyle = {
            name: 'Times New Roman',
        }

        const headerTitleStyle = {
            font: { ...golbalFontStyle, bold: true, size: 14 },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }

        const headerSubtitleStyle = {
            font: { ...golbalFontStyle, bold: true, size: 16 },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }
        const headerSubtitleStyle1 = {
            font: { ...golbalFontStyle, bold: true, size: 16 },
            alignment: {
                horizontal: 'left' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }
        const tableHeaderStyle = {
            font: {
                ...golbalFontStyle,
                bold: true,
                size: 14,
                color: { argb: 'FF000000' },
            },
            fill: {
                type: 'pattern',
                pattern: 'none',
            },
            alignment: {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            },
            border: {
                top: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                left: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                right: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                bottom: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
            },
        }

        worksheet.mergeCells('A1:C2')
        worksheet.getCell('A1').value = 'BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ'
        worksheet.getCell('A1').style = headerTitleStyle

        worksheet.getRow(1).height = 30
        worksheet.getRow(2).height = 30

        worksheet.mergeCells('E1:H2')
        worksheet.getCell('E1').value =
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
        worksheet.getCell('E1').style = headerTitleStyle

        worksheet.mergeCells('A4:H4')
        worksheet.getCell('A4').value = `Báo cáo khảo sát: ${name}`
        worksheet.getCell('A4').style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        let rowIndex = 11
        if (dataTableInfo?.length > 0) {
            worksheet.mergeCells('A7:C7')
            worksheet.getCell('A7').value = 'Thông kê chung'
            worksheet.getCell('A7').style = headerSubtitleStyle1
            // Thông tin chung
            const headerRowInfo = worksheet.getRow(9)
            headerRowInfo.values = ['STT', 'Đối tượng', 'Trạng thái']
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
        worksheet.getCell(`A${rowIndex}`).value = 'Thống kê theo từng Câu hỏi'
        worksheet.getCell(`A${rowIndex}`).style = headerSubtitleStyle1

        // Thêm tiêu đề bảng
        const headerRow = worksheet.getRow(rowIndex + 2)
        headerRow.values = dataTable[0]?.answers?.length
            ? [
                  'STT',
                  'Câu hỏi',
                  'Tên Câu hỏi',
                  // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                  ...dataTable[0]?.answers?.map((i: any) => i?.description),
              ]
            : ['STT', 'Câu hỏi', 'Tên Câu hỏi']
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
                const headerRowValue: any = worksheet.getRow(rowIndex + 3 + index)
                headerRowValue.values = [
                    index + 1,
                    `Câu hỏi ${index + 1}`,
                    i?.name,
                    ...calculatePercent(i?.answers).map(
                        (a: any) => `${a.percent || 0}% (${a?.count || 0}/${a?.total || 0})`
                    ),
                ]
            })
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), `Bao_cao_khao_sat_${name || ''}.xlsx`)
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
        return (
            <Table
                columns={
                    dataTable?.length > 0
                        ? [
                              {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  fixed: 'left',
                                  render: (_, __, index) => index + 1,
                              },
                              {
                                  title: 'Câu hỏi',
                                  align: 'center',
                                  width: 100,
                                  render: (_, record, index) => {
                                      return `Câu hỏi ${index + 1}`
                                  },
                              },
                                  {
                                  title: 'Nội dung câu hỏi',
                                  align: 'left',
                                  render: (_, record, index) => {
                                      return  <HtmlTruncate>
                                          {record?.name}
                                      </HtmlTruncate>
                                  },
                              },
                              // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                              ...dataTable[0]?.answers?.map((i: any) => ({
                                  title: i?.description,
                                  id: i?.id,
                                  dataIndex: i?.id,
                                  width: 170,
                                  align: 'center',
                                  render: (__: any, record: any) => {
                                      const count = calculatePercent(record?.answers).find(
                                          (a) => a.id === i?.id
                                      )

                                      return (
                                          `${count?.percent || 0}% (${count?.count || 0}/${count?.total})` ||
                                          '0'
                                      )
                                  },
                              })),
                          ]
                        : [
                              {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  fixed: 'left',
                                  render: (_, __, index) => index + 1,
                              },
                              {
                                  title: 'Câu hỏi',
                                  align: 'center',
                                  render: (_, record, index) => {
                                      return `Câu hỏi ${index + 1}`
                                  },
                              },
                          ]
                }
                dataSource={dataTable}
                pagination={false}
            />
        )
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
                                            title: 'STT',
                                            width: 60,
                                            align: 'center',
                                            fixed: 'left',
                                            render: (_, __, index) => index + 1,
                                        },
                                        {
                                            title: 'Đối tượng',
                                            render: (_, record, index) => {
                                                return record?.name
                                            },
                                        },
                                        {
                                            title: 'Trạng thái',
                                            align: 'center',
                                            width: 200,
                                            render: (_, record, index) => {
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

                <Col span={24}>
                    <div className="bg-white h-full flex flex-col">
                        <div className="p-4 flex justify-between">
                            <Title level={4}>Thống kê theo từng Câu hỏi</Title>
                            {dataLevel?.status === 200 && (
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        exportTemplate(
                                            dataLevel?.data?.surveyName,
                                            dataLevel?.data?.questions,
                                            data?.data
                                        )
                                    }
                                    size="small"
                                >
                                    Xuất báo cáo
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 mb-6">
                            {dataLevel?.status === 200 && dataLevel?.data?.questions?.length > 0 ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ReactECharts
                                        option={dataBarchart}
                                        className="w-full min-h-[400px]"
                                    />
                                    {dataLevel?.data?.questions?.length > 0 &&
                                        renderTable(dataLevel?.data?.questions)}
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
