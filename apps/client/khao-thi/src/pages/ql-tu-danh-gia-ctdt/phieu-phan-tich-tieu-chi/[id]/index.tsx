import CriteriaAnalysisSubPage from '@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import type {
    AnalysisFormEvidence,
    EvaluationCriterion,
    EvaluationStandard,
    Evidence,
    RequirementCriterion,
    ScoreScaleCatalog,
} from '@workspace/db'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Row, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export type DataTabType = EvaluationStandard & {
    criteria: (EvaluationCriterion & {
        requirementCriterions: (RequirementCriterion & {
            evidences: (AnalysisFormEvidence & {
                evidence: Evidence
            })[]
        })[]
        scoreScale: ScoreScaleCatalog
    })[]
}

export default function CriteriaAnalysisDetailPage() {
    const router = useRouter()
    const id = router.query.id as string

    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'e59c23ff-d7ef-4b49-b175-c675c4caabbb'

    const { data, refetch } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id,
                standards: {
                    some: {
                        criteria: {
                            some: {
                                criterionAssignments: {
                                    some: {
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
            },
            include: {
                standards: {
                    where: {
                        criteria: {
                            some: {
                                criterionAssignments: {
                                    some: {
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
                    include: {
                        criteria: {
                            where: {
                                criterionAssignments: {
                                    some: {
                                        lecturer: {
                                            userProfile: {
                                                id: idProfile,
                                            },
                                        },
                                    },
                                },
                            },
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
                                scoreScale: true,
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
            enabled: !!idProfile && !!id,
        }
    )

    const dataTab = useMemo(() => {
        if (data) {
            return data.standards.map((standard: DataTabType) => {
                return {
                    key: standard.id,
                    label: `Tiêu chuẩn ${standard.order}`,
                    children: (
                        <CriteriaAnalysisSubPage
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
                <Col span={24} className="text-2xl font-bold mb-4 px-4">
                    {data?.name}
                </Col>
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

CriteriaAnalysisDetailPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                {
                    title: 'QL tự đánh giá CTĐT',
                },
                {
                    title: 'Phiếu phân tích tiêu chí',
                    href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                },
                {
                    title: 'Chi tiết phiếu phân tích tiêu chí',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
