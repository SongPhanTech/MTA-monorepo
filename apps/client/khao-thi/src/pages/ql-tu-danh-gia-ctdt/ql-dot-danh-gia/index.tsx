import DefaultLayout from '@layouts/default-layout'
import EvaluationPeriod from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-period'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { Store, useStore } from '@tanstack/react-store'
import EvaluationCouncilTab from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-council'
import EvaluationStandardTab from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/evaluation-standard'

export type EvaluationPeriodStoreState = {
    selectedEvaluationPeriodId?: string
}

export const evaluationPeriodStore = new Store<EvaluationPeriodStoreState>({
    selectedEvaluationPeriodId: undefined,
})

export default function EvaluationPeriodTabPage() {
    const [activeKey, setActiveKey] = useState('1')

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const tabItems = useMemo(() => {
        return [
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
        ]
    }, [selectedEvaluationPeriodId])

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
