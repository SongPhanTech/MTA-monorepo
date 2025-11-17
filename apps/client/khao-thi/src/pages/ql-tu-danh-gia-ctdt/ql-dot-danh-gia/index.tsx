import DefaultLayout from '@layouts/default-layout'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-period'
import { Col, Row, Tabs } from 'antd'
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
    const idProfile = me?.sDM_NhanVienId || ''
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
        const tabs = [
            {
                key: '1',
                label: 'Danh sách đợt đánh giá',
                children: <EvaluationPeriod />,
            },
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
            },
            {
                key: '4',
                label: 'Phân công giảng viên',
                children: <AssigmentOfAssessmentTab />,
                disabled: !selectedEvaluationPeriodId,
            },
        ]

        const isVicePersident = councilMember?.role?.includes(
            $Enums.EvaluationMemberRole.VICE_PRESIDENT
        )

        if (isVicePersident) {
            tabs.push({
                key: '4',
                label: 'Phân công giảng viên',
                children: <AssigmentOfAssessmentTab />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

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

        return tabs
    }, [selectedEvaluationPeriodId, councilMember, can])

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

EvaluationPeriodTabPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
