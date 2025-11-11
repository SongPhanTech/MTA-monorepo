import DefaultLayout from '@layouts/default-layout'
import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import EvaluationPeriodCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/evaluation-period'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import ReviewCriteriaAnalysis from './_components/review-criteria-analysis'
import { useSession } from '@workspace/auth/react'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { $Enums } from '@workspace/db/client'

export default function CriteriaAnalysisPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || ''

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data: lecturer } = useFindUniqueLecturer(
        {
            where: {
                userProfileId: idProfile || '',
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

    const tabItems = useMemo(() => {
        const tabs = [
            {
                key: '1',
                label: 'Danh sách đợt đánh giá',
                children: <EvaluationPeriodCriteriaAnalysis />,
            },
            {
                key: '2',
                label: 'Phiếu phân tích tiêu chí',
                children: <CriteriaAnalysisWrite />,
                disabled: !selectedEvaluationPeriodId,
            },
            {
                key: '3',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis />,
                disabled: !selectedEvaluationPeriodId,
            },
            {
                key: '4',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: !selectedEvaluationPeriodId,
            },
        ]

        const isAdvisoryBoard = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.ADVISORY_BOARD
        )

        const isSecretary =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

        if (isAdvisoryBoard) {
            tabs.push({
                key: '3',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        return tabs
    }, [selectedEvaluationPeriodId, councilMember?.role])

    return (
        <Row gutter={[12, 0]}>
            <Col span={24}>
                <Tabs
                    activeKey={activeKey}
                    onChange={(key) => setActiveKey(key)}
                    items={tabItems}
                />
            </Col>
        </Row>
    )
}

CriteriaAnalysisPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
