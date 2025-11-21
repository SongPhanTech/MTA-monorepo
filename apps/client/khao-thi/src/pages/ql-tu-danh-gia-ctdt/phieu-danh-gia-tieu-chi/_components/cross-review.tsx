import CrossReviewSubPage from '@components/sub-pages/tu-danh-gia-ctdt/cross-review'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import type {
    CriterionPeriod,
    EvaluationCriterion,
    EvaluationCriterionComment,
    StandardPeriod,
} from '@workspace/db/client'
import { $Enums } from '@workspace/db/client'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { Col, Empty, Row, Tabs } from 'antd'
import { useMemo } from 'react'

export type DataTabCrossReviewType = StandardPeriod & {
    criteria: (CriterionPeriod & {
        evaluationCriterion?:
            | (EvaluationCriterion & {
                  evaluationCriterionComments?: (EvaluationCriterionComment & {
                      reviewer?: { fullname?: string | null }
                  })[]
                  lecturer?: { userProfile?: { fullname?: string | null } } | null
                  deadlineReview?: Date | null
              })
            | null
    })[]
}

export default function CrossReview() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data, refetch } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id: selectedEvaluationPeriodId,
                standards: {
                    some: {
                        criteria: {
                            some: {
                                evaluationCriterion: {
                                    reviewer: {
                                        lecturer: {
                                            userProfileId: idProfile,
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
                                    status: {
                                        not: $Enums.EvaluationStatus.LOCK,
                                    },
                                    reviewer: {
                                        lecturer: {
                                            userProfileId: idProfile,
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
                                    status: {
                                        not: $Enums.EvaluationStatus.LOCK,
                                    },
                                    reviewer: {
                                        lecturer: {
                                            userProfileId: idProfile,
                                        },
                                    },
                                },
                            },
                            include: {
                                evaluationCriterion: {
                                    include: {
                                        lecturer: {
                                            include: {
                                                userProfile: {
                                                    select: {
                                                        fullname: true,
                                                    },
                                                },
                                            },
                                        },
                                        evaluationCriterionComments: {
                                            include: {
                                                reviewer: {
                                                    select: {
                                                        fullname: true,
                                                    },
                                                },
                                            },
                                            orderBy: {
                                                createdAt: 'desc',
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
            enabled: !!idProfile && !!selectedEvaluationPeriodId,
        }
    )

    const dataTab = useMemo(() => {
        if (data && data.standards.length > 0) {
            return data.standards.map((standard: DataTabCrossReviewType) => {
                return {
                    key: standard.id,
                    label: `Tiêu chuẩn ${standard.order}`,
                    children: <CrossReviewSubPage key={standard.id} data={standard} onRefetch={refetch} />,
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
                                description="Chưa có phiếu đánh giá tiêu chí nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    )
}
