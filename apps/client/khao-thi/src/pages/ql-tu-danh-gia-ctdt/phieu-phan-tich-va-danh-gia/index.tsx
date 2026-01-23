import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-analysis'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/evaluation-period'
import ReviewCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis'
import CrossReview from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review'
import CrossReviewAssignment from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review-assignment'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import StandardReports from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports'
import CriteriaEvaluationWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-evaluation'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums } from '@workspace/db/client'
import {
    useFindFirstEvaluationCouncilMember,
    useFindUniqueEvaluationPeriod,
    useFindUniqueLecturer,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'
import EvaluateLayout from '@layouts/evaluate-layout'

export default function CriteriaAnalysisAndEvaluationPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'f1218263-341e-40c4-b269-a711a0186c74'

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { can } = useAbility()

    const { data: lecturer } = useFindUniqueLecturer(
        {
            where: {
                userProfileId: idProfile,
            },
        },
        {
            enabled: !!idProfile,
        }
    )

    const { data: councilMember } = useFindFirstEvaluationCouncilMember(
        {
            where: {
                lecturerId: lecturer?.id,
                evaluationCouncil: {
                    periodId: selectedEvaluationPeriodId,
                },
            },
            include: {
                evaluationCouncil: true,
            },
        },
        {
            enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
        }
    )

    const { data: evaluationPeriod } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id: selectedEvaluationPeriodId,
            },
            include: {
                standards: {
                    include: {
                        criteria: {
                            where: {
                                OR: [
                                    {
                                        analysisCriterions: {
                                            lecturer: {
                                                userProfileId: idProfile,
                                            },
                                        },
                                    },
                                    {
                                        evaluationCriterion: {
                                            lecturer: {
                                                userProfileId: idProfile,
                                            },
                                        },
                                    },
                                ],
                            },
                            include: {
                                analysisCriterions: {
                                    where: {
                                        lecturer: {
                                            userProfileId: idProfile,
                                        },
                                    },
                                },
                                evaluationCriterion: {
                                    where: {
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
        },
        {
            enabled: !!selectedEvaluationPeriodId && !!idProfile,
        }
    )

    const tabItems = useMemo(() => {
        const tabs: TabsProps['items'] = [
            {
                key: '1',
                label: 'Danh sách đợt đánh giá',
                children: <EvaluationPeriod />,
            },
        ]

        const disabledReviewAnalysisTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.DIRECTOR_REVIEW
        const disabledAdvisoryBoardTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.SECRETARY_REVIEW
        const disabledCrossReviewAssignmentTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT

        const disabledStandardReportTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CONSOLIDATION

        const disabledCrossReviewTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW

        const isAdvisoryBoard = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.ADVISORY_BOARD
        )

        const isHeadSpecialized = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.HEAD_SPECIALIZED
        )

        const isSecretary =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

        const isCouncilMember = !!councilMember

        if (
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'THEM'
            )
        ) {
            tabs.push({
                key: '2',
                label: 'Phiếu phân tích tiêu chí',
                children: <CriteriaAnalysisWrite />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'THEM'
            )
        ) {
            tabs.push({
                key: '3',
                label: 'Phiếu đánh giá tiêu chí',
                children: <CriteriaEvaluationWrite />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (isAdvisoryBoard) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu (Ban tư vấn)',
                children: <ReviewCriteriaAnalysis userRole="BAN_TU_VAN" />,
                disabled: disabledAdvisoryBoardTab,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '5',
                label: 'Xét duyệt phiếu (Thư ký)',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: disabledReviewAnalysisTab,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '6',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: disabledCrossReviewAssignmentTab,
            })
        }

        if (isCouncilMember) {
            tabs.push({
                key: '7',
                label: 'Phản biện chéo',
                children: <CrossReview userRole="REVIEWER" />,
                disabled: disabledCrossReviewTab,
            })
        }

        if (isHeadSpecialized) {
            tabs.push({
                key: '8',
                label: 'Báo cáo tiêu chuẩn',
                children: <StandardReports />,
                disabled: disabledStandardReportTab,
            })
        }

        return tabs
    }, [can, selectedEvaluationPeriodId, councilMember, evaluationPeriod])

    return (
        <Row gutter={[12, 0]}>
            <Col span={24}>
                <Tabs
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    items={tabItems}
                    tabBarGutter={10}
                />
            </Col>
        </Row>
    )
}

CriteriaAnalysisAndEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <EvaluateLayout>{page}</EvaluateLayout>
}
