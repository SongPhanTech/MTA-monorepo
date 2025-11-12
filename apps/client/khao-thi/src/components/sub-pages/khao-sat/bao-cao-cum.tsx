import useSpinner from '@hooks/spinner'
import {
    useExportReportSurvey,
    useExportReportSurveyOrganizational,
    useGetClusterSurveyStatistics,
} from '@workspace/libs/api/exam'
import { Button, Col, Empty, message, Row, Typography } from 'antd'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
const { Title } = Typography
function ClusterSurveyReport({ selectedId }: { selectedId: string }) {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()

    // const { data } = useGetParticipationByType({
    //     surveyId: selectedId as string,
    // })

    const { data: dataLevel } = useGetClusterSurveyStatistics(selectedId as string)
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
                j?.data.push(i?.average[index] || 0)
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
                data:
                    dataLevel?.data?.data?.map((i) => {
                        return `${i?.lecture}`
                    }) || [],
            },
            series: choices,
        }
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

    const exportReport = async () => {
        try {
            const res = await exportApi({
                data: { surveyId: selectedId as string },
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

    const onChartClick = (params: any) => {
        if (dataLevel?.status !== 200) {
            return
        }
        const result = dataLevel?.data?.data[params?.dataIndex]
        router.push(`/bao-cao-khao-sat/${result?.surveyId}`)
    }

    const onEvents = {
        click: onChartClick,
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
                            <Title level={4}>Thống kê khảo sát</Title>
                            <Button type="primary" onClick={exportReport}>
                                Xuất báo cáo
                            </Button>
                        </div>
                        <div className="flex-1">
                            {dataLevel?.status === 200 && dataLevel?.data ? (
                                <div
                                    style={{ width: '100%', height: '100%' }}
                                    className="min-h-[400px]"
                                >
                                    <ReactECharts
                                        onEvents={onEvents}
                                        option={dataBarchart}
                                        style={{ height: '100%' }}
                                    />
                                </div>
                                // <BarChart className="h-full" dataMap={dataBarchart} />
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

export default ClusterSurveyReport
