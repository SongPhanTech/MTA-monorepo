import DefaultLayout from '@layouts/default-layout'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-period'
import { Col, Row, Tabs, type TabsProps } from 'antd'
import { useMemo, useState } from 'react'
import { Store, useStore } from '@tanstack/react-store'
import EvaluationCouncilTab from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-council'
import EvaluationStandardTab from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-standard'
import AssigmentOfAssessmentTab from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/assigment'
import { useSession } from '@workspace/auth/react'
import { useFindFirstEvaluationCouncilMember, useFindUniqueLecturer } from '@workspace/db/hooks'
import { $Enums } from '@workspace/db/client'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import CriteriaAnalysisPeriodList from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/criteria-analysis'
import CriteriaEvaluationPeriodList from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/criteria-evaluation'
import CrossReviewPeriod from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/cross-review'

export type EvaluationPeriodStoreState = {
    selectedEvaluationPeriodId?: string
}

export const evaluationPeriodStore = new Store<EvaluationPeriodStoreState>({
    selectedEvaluationPeriodId: undefined,
})

export default function EvaluationPeriodTabPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const { can } = useAbility()
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
                children: <EvaluationPeriod />,
            },
        ]

        const isVicePersident = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.VICE_PRESIDENT
        )

        if (can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, 'THEM')) {
            tabs.push(
                {
                    key: '2',
                    label: 'Hội đồng',
                    children: <EvaluationCouncilTab />,
                    disabled: !selectedEvaluationPeriodId,
                },
                {
                    key: '3',
                    label: 'Tiêu chuẩn, tiêu chí',
                    children: <EvaluationStandardTab />,
                    disabled: !selectedEvaluationPeriodId,
                }
            )
        }

        if (
            isVicePersident ||
            can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, 'XEM')
        ) {
            tabs.push({
                key: '4',
                label: 'Phân công giảng viên',
                children: <AssigmentOfAssessmentTab />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            idProfile === 'e0bf913a-7b9c-40ac-9a52-266a4326e02f' ||
            can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA, 'XEM_CHI_TIET')
        ) {
            tabs.push(
                {
                    key: '5',
                    label: 'Danh sách phiếu phân tích tiêu chí',
                    children: <CriteriaAnalysisPeriodList />,
                    disabled: !selectedEvaluationPeriodId,
                },
                {
                    key: '6',
                    label: 'Danh sách phiếu đánh giá tiêu chí',
                    children: <CriteriaEvaluationPeriodList />,
                    disabled: !selectedEvaluationPeriodId,
                },
                {
                    key: '7',
                    label: 'Xem phản biện',
                    children: <CrossReviewPeriod />,
                    disabled: !selectedEvaluationPeriodId,
                }
            )
        }
        return tabs
    }, [selectedEvaluationPeriodId, councilMember, can, idProfile])

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

EvaluationPeriodTabPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
