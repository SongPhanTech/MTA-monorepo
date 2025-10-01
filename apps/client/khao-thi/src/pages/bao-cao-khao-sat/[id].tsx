import BarChart from '@components/dashboard/bar-chart'
import PieChart from '@components/dashboard/org-structure'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useExportReportSurvey,
    useExportReportSurveyOrganizational,
    useGetParticipationByType,
    useGetSurveyStatistics,
} from '@workspace/libs/api/exam'
import { Button, Col, Empty, Flex, message, Row, Typography } from 'antd'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

const { Title } = Typography
function Page() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useGetParticipationByType({
        surveyId: router.query.id as string,
    })

    const { data: dataLevel } = useGetSurveyStatistics(router.query.id as string)

    const dataBarchart = useMemo(() => {
        const result = []
        if (dataLevel?.status === 200 && dataLevel?.data?.questions?.length) {
            // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
            for (const i of dataLevel?.data?.questions) {
                // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                for (const j of i?.answers) {
                    if (j?.count > 0) {
                        result.push({
                            label: i?.name,
                            state: j?.answer,
                            value: j?.count,
                        })
                    }
                }
            }
        }
        return result
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
                data: { surveyId: router.query.id as string, semesterId: '', organizationId: '' },
            })
            if (res.status === 200) {
                saveAs(res.data, 'Bao_cao.xlsx')
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
                data: { surveyId: router.query.id as string },
            })
            if (res.status === 200) {
                saveAs(res.data, 'Bao_cao.xlsx')
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24} className="px-6 mt-3 mb-0">
                    <Flex justify="space-between">
                        <Title level={3}>
                            {(dataLevel?.status === 200 && dataLevel?.data?.surveyName) || ''}
                        </Title>
                        {/* <Button type="primary">Xuất báo cáo</Button> */}
                    </Flex>
                </Col>
                <Col span={24}>
                    <div className="bg-white h-full flex flex-col">
                        <div className="px-4 pb-4 flex justify-between">
                            <Title level={4}>Thống kê số lượng người tham gia</Title>
                            {/* <Button type="primary" onClick={exportReportForOrganization}>Xuất báo cáo</Button> */}
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
                </Col>

                <Col span={24}>
                    <div className="bg-white h-full flex flex-col">
                        <div className="p-4 flex justify-between">
                            <Title level={4}>Thống kê theo từng câu hỏi</Title>
                            <Button type="primary" onClick={exportReport}>
                                Xuất báo cáo
                            </Button>
                        </div>
                        <div className="flex-1">
                            {dataLevel?.status === 200 && dataLevel?.data?.questions?.length > 0 ? (
                                <BarChart className="h-full" dataMap={dataBarchart} />
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

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout breadcrumbList={[{ title: 'Báo cáo khảo sát' }]}>{page}</DefaultLayout>
}
