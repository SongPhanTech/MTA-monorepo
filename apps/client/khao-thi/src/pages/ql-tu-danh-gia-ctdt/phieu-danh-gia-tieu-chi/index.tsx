import DefaultLayout from '@layouts/default-layout'
import CriteriaEvaluationWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/criteria-evaluation'
import CrossReview from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/cross-review'
import EvaluationPeriodCriteriaEvaluation from '@pages/ql-tu-danh-gia-ctdt/phieu-danh-gia-tieu-chi/_components/evaluation-period'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'

export default function CriteriaEvaluationPage() {
    const [activeKey, setActiveKey] = useState('1')

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const tabItems = useMemo(() => {
        return [
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
                children: <CrossReview />,
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

CriteriaEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
