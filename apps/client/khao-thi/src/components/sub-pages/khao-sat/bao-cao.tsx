import useSpinner from '@hooks/spinner'
import {
    useExportReportSurvey,
    useExportReportSurveyOrganizational,
    useGetParticipationByType,
    useGetSurveyStatistics,
} from '@workspace/libs/api/exam'
import { Button, Col, Empty, message, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
// @ts-nocheck
import ReactECharts from 'echarts-for-react'
import { GetSurveyStatistics200QuestionsItemAnswersItem } from '@workspace/libs/api/schemas'
import Table from '@components/commons/table'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
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

type AnswerWithPercent = AnswerItem & { percent: number }
function SurveyReport({ selectedId }: { selectedId: string }) {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useGetParticipationByType({
        surveyId: selectedId as string,
    })

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

        // Trục Y: danh sách tiêu chí
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
            label = dataLevel?.data?.questions?.map((item, index) => `Tiêu chí ${index + 1}`)
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

    const renderQuestionReport = (item: {
        name: string
        answers: { answer: string; count: number }[]
    }) => {
        let total = 0
        if (item?.answers?.length) {
            // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
            for (const i of item?.answers) {
                total += i?.count
            }
        }

        return (
            <div className="flex items-center justify-between">
                <div>{item?.name}</div>
                <div className="flex items-center justify-end">
                    {item?.answers.map((j) => {
                        return (
                            <div className="mr-1">
                                {j?.answer}:
                                {total > 0
                                    ? Number.parseFloat(((j?.count * 100) / total).toFixed(2))
                                    : 0}
                                %
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    const { mutateAsync: exportApiForOrganizational } = useExportReportSurveyOrganizational()
    const { mutateAsync: exportApi } = useExportReportSurvey()
    const exportReportForOrganization = async () => {
        try {
            const res = await exportApiForOrganizational({
                data: { surveyId: selectedId as string, semesterId: '', organizationId: '' },
            })
            if (res.status === 200) {
                saveAs(res.data, 'Bao_cao.docx')
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

        const exportTemplate = async (name:string,dataTable:any) => {
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
    
            const headerStyleNormal = {
                font: { ...golbalFontStyle, size: 14 },
                alignment: {
                    horizontal: 'right' as const,
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
    
            const dataCellStyle = {
                font: { ...golbalFontStyle, size: 14 },
                alignment: {
                    horizontal: 'center' as const,
                    vertical: 'middle' as const,
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
    
            const _dataTextCellStyle = {
                ...dataCellStyle,
                alignment: {
                    horizontal: 'left' as const,
                    vertical: 'middle' as const,
                },
            }
    
            const italicTextStyle = {
                font: { ...golbalFontStyle, italic: true },
                alignment: {
                    horizontal: 'left' as const,
                    vertical: 'middle' as const,
                },
            }
    
            worksheet.mergeCells('A1:D2')
            worksheet.getCell('A1').value = 'BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ'
            worksheet.getCell('A1').style = headerTitleStyle
    
            worksheet.getRow(1).height = 30
            worksheet.getRow(2).height = 30
    
            worksheet.mergeCells('G1:N2')
            worksheet.getCell('G1').value =
                'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
            worksheet.getCell('G1').style = headerTitleStyle
    
            worksheet.mergeCells('A4:N4')
            worksheet.getCell('A4').value = `Báo cáo khảo sát: ${name}`
            worksheet.getCell('A4').style = headerSubtitleStyle
            worksheet.getRow(4).height = 20
    
            // Thêm tiêu đề bảng
            const headerRow = worksheet.getRow(11)
            headerRow.values = dataTable[0]?.answers?.length?[
                'STT',
                'Tiêu chí',
                'Tên tiêu chí',
               // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
               ...dataTable[0]?.answers?.map((i: any) => i?.description),

            ]:['STT',
                'Tiêu chí', 'Tên tiêu chí',]
            headerRow.eachCell((cell: any) => {
                cell.style = tableHeaderStyle
            })
    
            // Điều chỉnh độ rộng cột
            worksheet.columns = [
                { width: 10 },
                { width: 20 },
                { width: 60 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
            ]
            if (dataTable?.length > 0) {
                dataTable.forEach((i: any, index: number) => {
                    const headerRowValue: any = worksheet.getRow(12 + index)
                    headerRowValue.values = [
                        index + 1,
                       `Tiêu chí ${index + 1}`,
                       i?.name,
                        ...calculatePercent(i?.answers).map((a: any) => a.percent),
                    ]
                })
            }
    
            // Xuất file
            const buffer = await workbook.xlsx.writeBuffer()
            saveAs(new Blob([buffer]), `Bao_cao_khao_sat_${name ||''}.xlsx`)
        }

    // const exportReport = async (name?:string) => {
    //     try {
    //         const res = await exportApi({
    //             data: { surveyId: selectedId as string },
    //         })
    //         if (res.status === 200) {
    //             saveAs(res.data, `Bao_cao_khao_sat_${name ||''}.docx`)
    //         }
    //     } catch (error: any) {
    //         if (error?.info?.message) {
    //             message.error(error?.info?.message)
    //             return
    //         }
    //         message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    //     }
    // }
    function calculatePercent(items: AnswerItem[]): AnswerWithPercent[] {
        const total = items.reduce((sum, item) => sum + item.count, 0)
        return items.map((item) => ({
            ...item,
            percent: total === 0 ? 0 : Number.parseFloat(((item.count / total) * 100).toFixed(2)),
        }))
    }


    const renderTable=(dataTable:any)=>{

        return (
            <Table
                columns={dataTable?.length>0?[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Tiêu chí',
                        align: 'center',
                        render: (_, record, index) => {
                            return `Tiêu chí ${index + 1}`
                        },
                    },
                    // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                    ...dataTable[0]?.answers?.map((i:any) => ({
                        title: i?.description,
                        id: i?.id,
                        dataIndex: i?.id,
                        align: 'center',
                        width:200,
                        render: (__:any,record:any) => {
                            const count = calculatePercent(record?.answers).find((a) => a.id === i?.id)?.percent
                            console.log(count,record, i?.id);
                            
                            return  count ||'0'
                        },
                        })),
                ]:[
                        {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Tiêu chí',
                        align: 'center',
                        render: (_, record, index) => {
                            return `Tiêu chí ${index + 1}`
                        },
                    },
                ]}
                dataSource={dataTable}
                pagination={false}
            />
        )
        
    }


    return (
        <div>
            <Row gutter={[16, 16]}>
                {/* <Col span={24} className="px-6 mt-3 mb-0">
                    <Flex justify="space-between">
                        <Title level={3}>
                            {(dataLevel?.status === 200 && dataLevel?.data?.surveyName) || ''}
                        </Title>
                    </Flex>
                </Col> */}
                {/* <Col span={24}>
                    <div className="bg-white h-full flex flex-col">
                        <div className="px-4 pb-4 flex justify-between">
                            <Title level={4}>Thống kê số lượng người tham gia</Title>
                        </div>
                        <div className="flex-1">
                            {data?.status === 200 && data?.data?.statistics?.length > 0 ? (
                                <PieChart
                                    className="h-full"
                                    dataMap={data?.data?.statistics.map(
                                        (i: { studentType: string; participantCount: number }) => {
                                            return {
                                                type: i.studentType,
                                                value: i.participantCount,
                                            }
                                        }
                                    )}
                                />
                            ) : (
                                <Empty />
                            )}
                        </div>
                    </div>
                </Col> */}

                <Col span={24}>
                    <div className="bg-white h-full flex flex-col">
                        <div className="p-4 flex justify-between">
                            <Title level={4}>Thống kê theo từng tiêu chí</Title>
                            {
                                dataLevel?.status === 200 &&(
                                    <Button  type="primary" onClick={()=>exportTemplate(dataLevel?.data?.surveyName,dataLevel?.data?.questions)}>
                                Xuất báo cáo
                            </Button>
                                )
                            }
                            
                        </div>
                        <div className="flex-1">
                            {dataLevel?.status === 200 && dataLevel?.data?.questions?.length > 0 ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ReactECharts
                                        option={dataBarchart}
                                        className="w-full min-h-[400px]"
                                    />
                                    {
                                        dataLevel?.data?.questions?.length > 0 && (
                                          renderTable(dataLevel?.data?.questions)
                                        )
                                    }
                                    {/* <Table
                                        columns={columns}
                                        pagination={false}
                                        dataSource={dataLevel?.data?.questions}
                                    /> */}
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
