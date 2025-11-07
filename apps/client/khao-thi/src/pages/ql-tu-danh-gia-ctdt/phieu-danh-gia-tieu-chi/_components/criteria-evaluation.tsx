import CriteriaEvaluationSubPage from '@components/sub-pages/tu-danh-gia-ctdt/criteria-evaluation'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import type {
    CriterionPeriod,
    EvaluationCriterion,
    EvaluationCriterionComment,
    StandardPeriod,
} from '@workspace/db'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { Col, Row, Tabs } from 'antd'
import { useMemo } from 'react'

export type DataTabEvaluationCriterionType = StandardPeriod & {
    criteria: (CriterionPeriod & {
        evaluationCriterion?:
            | (EvaluationCriterion & {
                  evaluationCriterionComments?: EvaluationCriterionComment[]
              })
            | null
    })[]
}

export default function CriteriaEvaluationWrite() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'ad3cd5ec-2dfd-4839-8aeb-85f5e535f3db'

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id: selectedEvaluationPeriodId,
                standards: {
                    some: {
                        criteria: {
                            some: {
                                evaluationCriterion: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            include: {
                standards: {
                    where: {
                        criteria: {
                            some: {
                                evaluationCriterion: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    include: {
                        criteria: {
                            where: {
                                evaluationCriterion: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                            // include: {
                            //     requirementCriterions: {
                            //         include: {
                            //             evidences: {
                            //                 include: {
                            //                     evidence: true,
                            //                 },
                            //                 orderBy: {
                            //                     order: 'asc',
                            //                 },
                            //             },
                            //         },
                            //         orderBy: {
                            //             order: 'asc',
                            //         },
                            //     },
                            // },
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
            enabled: !!idProfile && !!selectedEvaluationPeriodId,
        }
    )

    const dataTab = useMemo(() => {
        if (data) {
            return data.standards.map((standard: DataTabEvaluationCriterionType) => {
                return {
                    key: standard.id,
                    label: `Tiêu chuẩn ${standard.order}`,

                    children: (
                        <CriteriaEvaluationSubPage
                            key={standard.id}
                            data={standard}
                            idx={standard.order}
                        />
                    ),
                }
            })
        }
    }, [data])

    return (
        <div className="h-full">
            <Row gutter={[8, 0]}>
                <Col span={24}>
                    <Tabs
                        className="h-[calc(100vh-200px)] overflow-y-auto"
                        tabPosition="left"
                        items={dataTab}
                        tabBarStyle={{
                            height: '100%',
                            overflow: 'auto',
                            width: '175px',
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}
