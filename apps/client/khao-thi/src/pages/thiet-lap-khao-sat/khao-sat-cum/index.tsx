import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'
import DetailSurveyPage from '@components/sub-pages/khao-sat/danh-sach-giang-vien'
import DanhSachHocVien from '@components/sub-pages/khao-sat/danh-sach-hoc-vien'
import TabDotKhaoSatCum from '@components/sub-pages/khat-sat-cum'
import DefaultLayout from '@layouts/default-layout'
import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import { Lecturer, Survey } from '@workspace/db'
import { Col, Row, Tabs } from 'antd'
import { useState } from 'react'
import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'

export type LectuerType = Lecturer & {
    survey: Survey[]
}

export default function ClussterSurveyPage() {
    const [activeKey, setActiveKey] = useState('1')
    const [selectedId, setSelectedId] = useState('')
    const [lecturer, setLecturer] = useState<LectuerType | null>(null)
    const [sublectClass, setSublectClass] = useState<any>(null)
    const items = [
        {
            key: '1',
            label: 'Đợt khảo sát',
            children: (
                <TabDotKhaoSatCum
                    selectedId={selectedId}
                    setSelectedId={(value) => {
                        setSelectedId(value)
                        setLecturer(null)
                    }}
                />
            ),
        },
        {
            key: '2',
            label: 'Danh sách giảng viên',
            children: (
                <DetailSurveyPage
                    selectedId={selectedId}
                    surveyId={lecturer?.id || ''}
                    setSurvey={(value) => {
                        setLecturer(value)
                    }}
                />
            ),
            disabled: !selectedId,
        },
        {
            key: '3',
            label: 'Danh sách người làm khảo sát',
            children: <DanhSachHocVien lecturer={lecturer} selectedId={selectedId} />,
            disabled: !lecturer?.id,
        },
        {
            key: '4',
            label: 'Báo cáo khảo sát',
            children: (
                <ClusterSurveyReport
                    selectedId={selectedId}
                    surveyName=""
                    surveyId={lecturer?.id || ''}
                    setSurvey={(value) => {
                        setLecturer(value)
                    }}
                />
            ),
            disabled: !selectedId,
        },
        {
            key: '5',
            label: 'Báo cáo theo giảng viên',
            children: (
                <LecturerSurveyReport selectedId={selectedId} lectureId={lecturer?.id || ''} sublectClass={sublectClass} setSublectClass={(value:any)=>{setSublectClass(value)}} />
            ),
            disabled: !lecturer?.id,
        },
        {
            key: '6',
            label: 'Báo cáo theo lớp môn học',
            children: <SurveyReport selectedId={sublectClass?.id || ''} />,
            disabled: !sublectClass?.id,
        },
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
