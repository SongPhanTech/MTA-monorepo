import CriteriaEvaluationSubPage from '@components/sub-pages/tu-danh-gia-ctdt/criteria-evaluation'
import DefaultLayout from '@layouts/default-layout'
import type { DataTabType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/[id]'
import { useSession } from '@workspace/auth/react'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Row, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export type PutRequirementCriterion = {
    opening: string
    conclusion: string
    criteria: Record<string, any>
}

export default function CriteriaEvaluationFormDetailPage() {
    const router = useRouter()
    const id = router.query.id as string

    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'e59c23ff-d7ef-4b49-b175-c675c4caabbb'

    const { data } = useFindUniqueEvaluationPeriod(
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

CriteriaEvaluationFormDetailPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                {
                    title: 'QL tự đánh giá CTĐT',
                },
                {
                    title: 'Phiếu đánh giá tiêu chí',
                    href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
                },
                {
                    title: 'Chi tiết phiếu đánh giá tiêu chí',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
