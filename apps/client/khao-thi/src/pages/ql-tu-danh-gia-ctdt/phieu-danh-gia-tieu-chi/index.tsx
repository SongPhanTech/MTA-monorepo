import DefaultLayout from '@layouts/default-layout'
import CriteriaEvaluationWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import CrossReview from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review'
import CrossReviewAssignment from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review-assignment'
import EvaluationPeriodCriteriaEvaluation from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/evaluation-period'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums } from '@workspace/db/client'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'

export default function CriteriaEvaluationPage() {
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
                children: <EvaluationPeriodCriteriaEvaluation />,
            },
            {
                key: '2',
                label: 'Phiếu đánh giá tiêu chí',
                children: <CriteriaEvaluationWrite />,
                disabled: !selectedEvaluationPeriodId,
            },
            {
                key: '3',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: !selectedEvaluationPeriodId,
            },
            {
                key: '4',
                label: 'Phản biện chéo',
                children: <CrossReview />,
                disabled: !selectedEvaluationPeriodId,
            },
        ]

        const isSecretary =
            councilMember?.role.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY) ||
            councilMember?.role.includes($Enums.EvaluationMemberRole.SECRETARY)

        if (isSecretary) {
            tabs.push({
                key: '3',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (councilMember) {
            tabs.push({
                key: '4',
                label: 'Phản biện chéo',
                children: <CrossReview />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        return tabs
    }, [selectedEvaluationPeriodId, councilMember])

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

CriteriaEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
