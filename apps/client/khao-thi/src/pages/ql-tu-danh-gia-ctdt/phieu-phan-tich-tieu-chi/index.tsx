import DefaultLayout from '@layouts/default-layout'
import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import EvaluationPeriodCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/evaluation-period'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'
import ReviewCriteriaAnalysis from './_components/review-criteria-analysis'
import { useSession } from '@workspace/auth/react'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { $Enums } from '@workspace/db/client'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'

export default function CriteriaAnalysisPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const { can } = useAbility()

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
        const tabs: TabsProps['items'] = [
            {
                key: '1',
                label: 'Danh sách đợt đánh giá',
                children: <EvaluationPeriodCriteriaAnalysis />,
            },
        ]

        if (
            can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI, 'THEM')
        ) {
            tabs.push({
                key: '2',
                label: 'Phiếu phân tích tiêu chí',
                children: <CriteriaAnalysisWrite />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        const isAdvisoryBoard =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.ADVISORY_BOARD) ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                'XEM_TAT_CA'
            )

        const isSecretary =
            councilMember?.role?.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            councilMember?.role?.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY) ||
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                'XEM_TAT_CA'
            )

        if (isAdvisoryBoard) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu (Ban tư vấn)',
                children: <ReviewCriteriaAnalysis userRole="BAN_TU_VAN" />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '5',
                label: 'Xét duyệt phiếu (Thư ký)',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        return tabs
    }, [selectedEvaluationPeriodId, councilMember, can])

    return (
        <Row gutter={[12, 0]}>
            <Col span={24}>
                <Tabs
                    activeKey={activeKey}
                    onChange={(key) => setActiveKey(key)}
                    items={tabItems}
                    tabBarGutter={10}
                />
            </Col>
        </Row>
    )
}

CriteriaAnalysisPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
