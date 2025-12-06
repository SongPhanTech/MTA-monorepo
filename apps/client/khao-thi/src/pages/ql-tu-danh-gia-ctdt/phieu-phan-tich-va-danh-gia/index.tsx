import DefaultLayout from '@layouts/default-layout'
import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/criteria-analysis'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/evaluation-period'
import ReviewCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/review-criteria-analysis'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums } from '@workspace/db/client'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'

export default function CriteriaAnalysisAndEvaluationPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_DonViId || '97edb89d-9803-45b9-ac83-e81125dd59c4'

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
        },
        {
            enabled: !!lecturer?.id && !!selectedEvaluationPeriodId,
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

        if (
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
                'THEM'
            )
        ) {
            tabs.push(
                {
                    key: '2',
                    label: 'Phiếu phân tích tiêu chí',
                    children: <CriteriaAnalysisWrite />,
                    disabled: !selectedEvaluationPeriodId,
                },
                {
                    key: '5',
                    label: 'Phiếu đánh giá tiêu chí',
                    
                }
            )
        }

        const isAdvisoryBoard = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.ADVISORY_BOARD
        )

        const isSecretary =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY)

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

        return tabs
    }, [can, selectedEvaluationPeriodId, councilMember])

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
