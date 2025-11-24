import DefaultLayout from '@layouts/default-layout'
import CriteriaEvaluationWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import CriteriaEvaluationList from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation-list'
import CrossReview from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review'
import CrossReviewAssignment from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review-assignment'
import EvaluationPeriodCriteriaEvaluation from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/evaluation-period'
import SumaryOfCriteriaEvaluation from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/sumary-criteria-evaluation'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums } from '@workspace/db/client'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'

export default function CriteriaEvaluationPage() {
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
                children: <EvaluationPeriodCriteriaEvaluation />,
            },
        ]

        if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI, 'THEM')) {
            tabs.push({
                key: '2',
                label: 'Phiếu đánh giá tiêu chí',
                children: <CriteriaEvaluationWrite />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            // can(
            //     KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
            //     'XEM_TAT_CA'
            // )
            idProfile === 'e0bf913a-7b9c-40ac-9a52-266a4326e02f'
        ) {
            tabs.push({
                key: '3',
                label: 'Danh sách phiếu đánh giá tiêu chí',
                children: <CriteriaEvaluationList />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        const isSecretary =
            councilMember?.role.includes($Enums.EvaluationMemberRole.HEAD_SECRETARY) ||
            councilMember?.role.includes($Enums.EvaluationMemberRole.SECRETARY) ||
            // can(
            //     KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
            //     'XEM_TAT_CA'
            // )
            idProfile === 'e0bf913a-7b9c-40ac-9a52-266a4326e02f'

        const isCouncilMember =
            !!councilMember ||
            // can(
            //     KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
            //     'XEM_TAT_CA'
            // )
            idProfile === 'e0bf913a-7b9c-40ac-9a52-266a4326e02f'

        if (isSecretary) {
            tabs.push({
                key: '4',
                label: 'Phân công phản biện chéo',
                children: <CrossReviewAssignment />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (isCouncilMember) {
            tabs.push({
                key: '5',
                label: 'Phản biện chéo',
                children: <CrossReview />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (isSecretary) {
            tabs.push({
                key: '6',
                label: 'Tổng hợp phiếu đánh giá',
                children: <SumaryOfCriteriaEvaluation />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        return tabs
    }, [
        selectedEvaluationPeriodId,
        councilMember,
        can, // can(
        //     KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
        //     'XEM_TAT_CA'
        // )
        idProfile,
    ])

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
