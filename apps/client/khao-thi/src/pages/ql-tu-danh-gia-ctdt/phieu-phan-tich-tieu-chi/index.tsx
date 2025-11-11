import DefaultLayout from '@layouts/default-layout'
import CriteriaAnalysisWrite from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/criteria-analysis'
import EvaluationPeriodCriteriaAnalysis from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-tieu-chi/_components/evaluation-period'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import ReviewCriteriaAnalysis from './_components/review-criteria-analysis'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'

export default function CriteriaAnalysisPage() {
    const [activeKey, setActiveKey] = useState('1')
    const { can } = useAbility()

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

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
        ]

        if (
            can(KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI, 'DUYET')
        ) {
            tabs.push({
                key: '3',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        if (
            can(
                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
                'XEM_TAT_CA'
            )
        ) {
            tabs.push({
                key: '4',
                label: 'Xét duyệt phiếu',
                children: <ReviewCriteriaAnalysis userRole="THU_KY" />,
                disabled: !selectedEvaluationPeriodId,
            })
        }

        return tabs
    }, [selectedEvaluationPeriodId, can])

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
