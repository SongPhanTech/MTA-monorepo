import Table from '@components/commons/table'
import { buildOrgTree } from '@lib/utils'
import { useFindManyDM_DonVi } from '@workspace/db/hooks'
import { useGetLectureSurveyStatistics } from '@workspace/libs/api/exam'
import { Button, Col, Empty, Flex, message, Row, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

const { Title } = Typography

type AnswerItem = {
    id: string
    code: string | null
    active: boolean
    description: string
    deletedAt: string | null
    createdAt: string
    updatedAt: string
    createdBy: string | null
    answer: string
    requireExplanation: boolean
    clusterSurveyId: string
    totalCount: number
}

type AnswerWithPercent = AnswerItem & { percent: number; total: number }
function ClusterSurveyReport({
    selectedId,
    surveyName,
}: {
    selectedId: string
    surveyName: string
}) {
    const router = useRouter()

    const { data: dataLevel } = useGetLectureSurveyStatistics(selectedId as string)
    const { data: organizations = [] } = useFindManyDM_DonVi({
         orderBy: { iSTT: 'desc' }
    })
    const treeData = buildOrgTree(organizations)

    const dataBarchart = useMemo(() => {
        let choices: any = []

        if (dataLevel?.status !== 200) {
            return
        }
        choices = dataLevel?.data?.choices.map((i) => {
            return {
                name: i?.description,
                type: 'bar',
                stack: 'total',
                label: {
                    show: true,
                },
                emphasis: {
                    focus: 'series',
                },
                data: [],
            }
        })

        dataLevel?.data?.data.forEach((i: any) => {
            choices.forEach((j: any, index: number) => {
                j?.data.push(i?.average[index]?.totalCount || 0)
            })
        })

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
                data: dataLevel?.data?.data.map(
                    (i) => `${i?.lecture?.code || ''} - ${i?.lecture?.userProfile?.fullname || ''}`
                ),
            },
            series: choices,
        }
    }, [dataLevel])

    const exportReport = async (dataExport: any, choices: any) => {
        try {
            if (choices?.length <= 0) {
                return
            }
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Báo cáo khảo sát theo giảng viên')

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
            worksheet.getCell('A4').value = `Báo khảo sát: ${surveyName}`
            worksheet.getCell('A4').style = headerSubtitleStyle
            worksheet.getRow(4).height = 20

            // Thêm tiêu đề bảng
            const headerRow = worksheet.getRow(7)
            headerRow.values = ['STT', 'Đối tượng', ...choices.map((i: any) => i?.description)]
            headerRow.eachCell((cell: any) => {
                cell.style = tableHeaderStyle
            })

            // Điều chỉnh độ rộng cột
            worksheet.columns = [
                { width: 10 },
                { width: 40 },
                { width: 40 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
            ]
            if (dataExport && dataExport.length > 0) {
                dataExport.forEach((i: any, index: number) => {
                    const headerRowValue: any = worksheet.getRow(8 + index)
                    headerRowValue.values = [
                        index + 1,
                        `${i?.lecture?.code || ''} - ${i?.lecture?.userProfile?.fullname || ''}`,
                        ...calculatePercent(i?.average).map(
                            (a: any) =>
                                `${a.percent || 0}% (${a?.totalCount || 0}/${a?.total || 0})`
                        ),
                    ]
                })
            }

            // Xuất file
            const buffer = await workbook.xlsx.writeBuffer()
            saveAs(new Blob([buffer]), 'Baocao.xlsx')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    const onChartClick = (params: any) => {
        if (dataLevel?.status !== 200) {
            return
        }
        // const result = dataLevel?.data?.data[params?.dataIndex]
        // router.push(`/bao-cao-khao-sat/${result?.surveyId}`)
    }

    const onEvents = {
        click: onChartClick,
    }

    function calculatePercent(items: AnswerItem[]): AnswerWithPercent[] {
        const total = items.reduce((sum, item) => sum + item.totalCount, 0)
        return items.map((item) => ({
            ...item,
            total,
            percent:
                total === 0 ? 0 : Number.parseFloat(((item.totalCount / total) * 100).toFixed(2)),
        }))
    }

    const renderTable = (dataTable: any, choices: any) => {
        return (
            <Table
                // onRow={(record) => {
                //     return {
                //         onClick: () => {
                //             setSurvey(record?.id as string)
                //         },
                //         className: cn(surveyId === record?.id ? 'bg-orange-200' : ''),
                //     }
                // }}
                columns={
                    choices?.length > 0
                        ? [
                              {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  fixed: 'left',
                                  render: (_, __, index) => index + 1,
                              },
                              {
                                  title: 'Đối tượng',
                                  align: 'center',
                                  render: (_, record) => {
                                      return `${record?.lecture?.code || ''} - ${record?.lecture?.userProfile?.fullname || ''}`
                                  },
                              },
                              // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                              ...choices?.map((i: any, index: number) => ({
                                  title: i?.description,
                                  id: i?.id,
                                  dataIndex: i?.id,
                                  align: 'center',
                                  render: (__: any, record: any) => {
                                      const count = calculatePercent(record?.average).find(
                                          (a) => a.id === i?.id
                                      )
                                      return (
                                          `${count?.percent || 0}% (${count?.totalCount || 0}/${count?.total})` ||
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
                                  title: 'Đối tượng',
                                  align: 'center',
                                  render: (_, record) => {
                                      return record?.lecture
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
            <Row gutter={[16, 4]}>
                <Col span={24}>
                    {dataLevel?.status === 200 && (
                        <div className="bg-white h-full flex flex-col">
                            <div className="px-4 py-2 flex justify-between">
                                <Title level={4}>Thống kê theo giảng viên</Title>
                                <Flex justify="end">
                                    {/* <TreeSelect
                                        multiple
                                        maxTagCount="responsive"
                                        allowClear
                                        showSearch
                                        placeholder="Chọn đơn vị quản lý"
                                        treeDefaultExpandAll
                                        treeData={treeData}
                                        value={organization}
                                        className="mr-4 w-[300px]"
                                        onChange={(value) => {
                                            setOrganization(value)
                                        }}
                                    /> */}
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={() =>
                                            exportReport(
                                                dataLevel?.data?.data,
                                                dataLevel?.data?.choices
                                            )
                                        }
                                    >
                                        Xuất báo cáo
                                    </Button>
                                </Flex>
                            </div>
                            <div className="flex-1">
                                {dataLevel?.status === 200 && dataLevel?.data ? (
                                    <div style={{ width: '100%', height: '100%' }}>
                                        <ReactECharts
                                            onEvents={onEvents}
                                            option={dataBarchart}
                                            className="w-full min-h-[400px] mb-6"
                                        />

                                        {dataLevel?.data?.data?.length > 0 &&
                                            renderTable(
                                                dataLevel?.data?.data,
                                                dataLevel?.data?.choices
                                            )}
                                    </div>
                                    // <BarChart className="h-full" dataMap={dataBarchart} />
                                ) : (
                                    <Empty />
                                )}
                            </div>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    )
}

export default ClusterSurveyReport
