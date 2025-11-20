import CriteriaAnalysisSubPage from '@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { Col, Empty, Row, Tabs } from 'antd'
import { useMemo } from 'react'

export default function CriteriaAnalysisList() {
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data, refetch } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id: selectedEvaluationPeriodId,
            },
            include: {
                standards: {
                    include: {
                        criteria: {
                            include: {
                                analysisCriterions: {
                                    include: {
                                        requirementCriterions: {
                                            include: {
                                                evidences: {
                                                    include: {
                                                        evidence: true,
                                                    },
                                                    orderBy: {
                                                        order: 'asc',
                                                    },
                                                },
                                            },
                                            orderBy: {
                                                order: 'asc',
                                            },
                                        },
                                        lecturer: {
                                            include: {
                                                userProfile: true,
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        },
        {
            enabled: !!selectedEvaluationPeriodId,
        }
    )

    const dataTab = useMemo(() => {
        if (data) {
            return data.standards.map((standard) => {
                return {
                    key: standard.id,
                    label: `Tiêu chuẩn ${standard.order}`,
                    children: (
                        <CriteriaAnalysisSubPage
                            key={standard.id}
                            data={standard}
                            idx={standard.order}
                            userRole="P13"
                            refetch={refetch}
                        />
                    ),
                }
            })
        }
    }, [data, refetch])

    return (
        <div className="h-full">
            <Row gutter={[8, 0]}>
                <Col span={24}>
                    {data && data.standards.length > 0 ? (
                        <Tabs
                            className="h-[calc(100vh-200px)] overflow-y-auto"
                            tabPosition="left"
                            items={dataTab}
                            tabBarStyle={{
                                height: '100%',
                                overflow: 'auto',
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                            <Empty
                                description="Chưa có phiếu phân tích tiêu chí nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    )
}
