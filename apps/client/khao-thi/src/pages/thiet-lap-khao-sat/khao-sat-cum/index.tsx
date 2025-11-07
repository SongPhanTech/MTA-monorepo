import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import DanhSachDoiTuong from '@components/sub-pages/khao-sat/danh-sach-dt-lam-khao-sat'
import DetailSurveyPage from '@components/sub-pages/khao-sat/danh-sach-giang-vien'
import TabDotKhaoSatCum from '@components/sub-pages/khat-sat-cum'
import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import { useState } from 'react'

export default function ClussterSurveyPage() {
    const [activeKey, setActiveKey] = useState('1')
    const [selectedId,setSelectedId]= useState('')
    const [surveyId,setSurveyId]= useState('')
    const items = [
        {
            key: '1',
            label: 'Khảo sát cụm',
            children: <TabDotKhaoSatCum selectedId={selectedId} setSelectedId={(value)=>{setSelectedId(value)
                setSurveyId('')
            }} />,
        },
          {
            key: '2',
            label: 'Danh sách giảng viên',
            children: <DetailSurveyPage selectedId={selectedId} />,
            disabled: !selectedId,
        },
        {
            key: '3',
            label: 'Danh sách người làm khảo sát',
            children: <DanhSachDoiTuong selectedId={selectedId} />,
            disabled: !surveyId,
        },
        {
            key: '4',
            label: 'Báo cáo khảo sát',
            children: <SurveyReport selectedId={surveyId} />,
            disabled: !surveyId,
        }
    ]

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
            </Col>
        </Row>
    )
}
ClussterSurveyPage.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
