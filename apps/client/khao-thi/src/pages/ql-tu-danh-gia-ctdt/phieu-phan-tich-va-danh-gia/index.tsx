import DefaultLayout from '@layouts/default-layout'
import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-analysis'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/evaluation-period'
import ReviewCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis'
import CriteriaEvaluationWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-evaluation'
import CrossReview from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review'
import CrossReviewAssignment from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/cross-review-assignment'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
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

export default function CriteriaAnalysisAndEvaluationPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_DonViId || '8bca0fb4-e233-4010-bb23-ed4cbe414726'

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
        },
        {
            enabled: !!selectedEvaluationPeriodId,
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

        const disableAnalysisWritingTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.ANALYSIS_WRITING
        const disableCrossReviewAssignmentTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT
        const disableCrossReviewTab =
            !selectedEvaluationPeriodId ||
            evaluationPeriod?.status !== $Enums.EvaluationPeriodStatus.CROSS_REVIEW

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

        if (
            isAdvisoryBoard ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                'XEM_TAT_CA'
            )
        ) {
            tabs.push({
                key: '3',
                label: 'Xét duyệt phiếu (Ban tư vấn)',
                children: <ReviewCriteriaAnalysis userRole="BAN_TU_VAN" />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            isSecretary ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                'XEM_TAT_CA'
            )
        ) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu (Thư ký)',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
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
                key: '5',
                label: 'Phiếu đánh giá tiêu chí',
                children: <CriteriaEvaluationWrite />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            isSecretary ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'XEM_TAT_CA'
            )
        ) {
            tabs.push({
                key: '6',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: disableCrossReviewAssignmentTab,
            })
        }

        if (
            isCouncilMember ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'XEM_TAT_CA'
            )
        ) {
            tabs.push({
                key: '7',
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
