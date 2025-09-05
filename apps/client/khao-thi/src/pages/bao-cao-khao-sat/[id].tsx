import PieChart from '@components/dashboard/org-structure'
import StaffByOrg from '@components/dashboard/staff-by-org'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useGetAnswerStatisticsByLevel, useGetParticipationByType } from '@workspace/libs/api/exam'
import { Col, Empty, Row, Typography } from 'antd'
import { useRouter } from 'next/router'

const { Title } = Typography
function Page() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useGetParticipationByType({
        surveyId: router.query.id as string,
    })

    const { data: dataLevel } = useGetAnswerStatisticsByLevel({
        surveyId: router.query.id as string,
    })

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thống kê số lượng giảng viên theo đầu mối</Title>
                        </div>
                        <div className="flex-1">
                            {data?.status === 200 && data?.data?.statistics?.length > 0 ? (
                                <StaffByOrg
                                    dataMap={data?.data?.statistics.map(
                                        (i: { studentType: string; participantCount: number }) => {
                                            return {
                                                letter: i.studentType,
                                                frequency: i.participantCount,
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
                    <div className="bg-white rounded shadow h-96 flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thống kê đối tượng đào tạo</Title>
                        </div>
                        <div className="flex-1">
                            {dataLevel?.status === 200 &&
                            dataLevel?.data?.statistics?.length > 0 ? (
                                <PieChart
                                    className="h-full"
                                    dataMap={dataLevel?.data?.statistics.map(
                                        (i: { levelName: string; count: number }) => {
                                            return {
                                                type: i.levelName,
                                                value: i.count,
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
            </Row>
        </div>
    )
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout breadcrumbList={[{ title: 'Báo cáo khảo sát' }]}>{page}</DefaultLayout>
}
