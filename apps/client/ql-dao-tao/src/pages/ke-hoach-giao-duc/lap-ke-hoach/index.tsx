import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import SubjectBySemester from './_components/mon-theo-ke-hoach-du-kien'
import RegisterResult from './_components/ket-qua-dang-ky-hoc-lop-quan-ly'
import FixedClass from './_components/lop-co-mon-theo-khgd'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function PlanTraining() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const [subjectClassId, setSubjectClassId] = useState<string | null>(null)
    const leftTabs: TabItem[] = [
        {
            key: '1',
            label: 'Môn theo kế hoạch giảng dạy',
            content: <SubjectBySemester />,
        },
        {
            key: '2',
            label: 'Môn học chậm tiến độ',
            content: <SubjectBySemester />,
        },
        {
            key: '3',
            label: 'Môn học kỳ sau',
            content: <RegisterResult />,
        },
    ]

    const rightTabsMap: TabItem[] = [
        {
            key: '1',
            label: 'Môn học đã lập kế hoạch',
            content: <FixedClass subjectClassId={subjectClassId} />,
        },
    ]

    return (
        <Row gutter={[8, 0]} className="bg-white">
            <Col span={14}>
                <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
                    {leftTabs.map((tab) => (
                        <Tabs.TabPane tab={tab.label} key={tab.key}>
                            {tab.content}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </Col>
            <Col span={10}>
                <Tabs defaultActiveKey="1">
                    {rightTabsMap.map((tab) => (
                        <Tabs.TabPane tab={tab.label} key={tab.key}>
                            {tab.content}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </Col>
        </Row>
    )
}

PlanTraining.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
