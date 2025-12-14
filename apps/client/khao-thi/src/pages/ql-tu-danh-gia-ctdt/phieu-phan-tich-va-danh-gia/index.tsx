import DefaultLayout from '@layouts/default-layout'
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
    useFindUniqueUserProfile,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'

export default function CriteriaAnalysisAndEvaluationPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'f807eaaa-d3d9-4899-9024-3363ff2d3193'

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { can } = useAbility()

    const { data: lecturer } = useFindUniqueUserProfile(
        {
            where: {
                id: idProfile || '',
            },
        },
        {
            enabled: !!idProfile,
        }
    )

    const { data: councilMember } = useFindFirstEvaluationCouncilMember(
        {
            where: {
                lecturerId: lecturer?.id || '',
                evaluationCouncil: {
                    periodId: selectedEvaluationPeriodId || '',
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

        // Kiểm tra xem có phiếu phân tích nào đang yêu cầu chỉnh sửa không
        const hasRevisionAnalysisCriterion = evaluationPeriod?.standards?.some((standard) =>
            standard.criteria?.some(
                (criterion) =>
                    criterion.analysisCriterions?.status ===
                    $Enums.EvaluationCriterionStatus.REVISION
            )
        )

        // Kiểm tra xem có phiếu đánh giá nào đang yêu cầu chỉnh sửa không
        const hasRevisionEvaluationCriterion = evaluationPeriod?.standards?.some((standard) =>
            standard.criteria?.some(
                (criterion) =>
                    criterion.evaluationCriterion?.status === $Enums.EvaluationStatus.REVISION
            )
        )

        const disableAnalysisWritingTab =
            !selectedEvaluationPeriodId ||
            (evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.ANALYSIS_WRITING &&
                !hasRevisionAnalysisCriterion)
        const disabledEvaluationWriteTab =
            !selectedEvaluationPeriodId ||
            (evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.EVALUATION_WRITING &&
                !hasRevisionEvaluationCriterion)
        const disableCrossReviewAssignmentTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT
        const disableCrossReviewTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW
        const disabledReviewAnalysisTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.DIRECTOR_REVIEW
        const disabledAdvisoryBoardTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.SECRETARY_REVIEW

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
                disabled: disableAnalysisWritingTab,
            })
        }

        const isAdvisoryBoard = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.ADVISORY_BOARD
        )

        const isSecretary =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

        const isCouncilMember = !!councilMember

        if (isAdvisoryBoard) {
            tabs.push({
                key: '3',
                label: 'Xét duyệt phiếu (Ban tư vấn)',
                children: <ReviewCriteriaAnalysis userRole="BAN_TU_VAN" />,
                disabled: disabledAdvisoryBoardTab,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu (Thư ký)',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: disabledReviewAnalysisTab,
            })
        }

        if (
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'THEM'
            )
        ) {
            tabs.push(
                {
                    key: '5',
                    label: 'Phiếu đánh giá tiêu chí',
                    children: <CriteriaEvaluationWrite />,
                    // disabled: !selectedEvaluationPeriodId,
                    disabled: !selectedEvaluationPeriodId,
                },
                {
                    key: '6',
                    label: 'Báo cáo tiêu chuẩn',
                    children: <StandardReports />,
                    // disabled: disabledEvaluationWriteTab,
                    disabled: !selectedEvaluationPeriodId,
                }
            )
        }

        if (isSecretary) {
            tabs.push({
                key: '7',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: disableCrossReviewAssignmentTab,
            })
        }

        if (isCouncilMember) {
            tabs.push({
                key: '8',
                label: 'Phản biện chéo',
                children: <CrossReview userRole="REVIEWER" />,
                disabled: disableCrossReviewTab,
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
    return <DefaultLayout>{page}</DefaultLayout>
}
