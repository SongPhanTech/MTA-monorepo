import DefaultLayout from '@layouts/default-layout'
import { Col, Flex, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import RegisterClassManager from './components/dang-ky-hoc-cho-lop-quan-ly'
import StudentCourseByPlan from './components/hoc-vien-co-mon-theo-khgd'
import RegisterResult from './components/ket-qua-dang-ky-hoc-lop-quan-ly'
import FixedClass from './components/lop-co-mon-theo-khgd'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function RegisterClass() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const [subjectClassId, setSubjectClassId] = useState<string | null>(null)
    const leftTabs: TabItem[] = [
        {
            key: '1',
            label: 'Đăng ký học cho lớp quản lý',
            content: <RegisterClassManager setSubjectClassId={setSubjectClassId} />,
        },
        {
            key: '2',
            label: 'Đăng ký học cho cá nhân',
            content: <RegisterClassManager setSubjectClassId={setSubjectClassId} />,
        },
        {
            key: '3',
            label: 'Kết quả đăng ký học lớp quản lý',
            content: <RegisterResult />,
        },
    ]

    const rightTabsMap: Record<string, TabItem[]> = {
        '1': [
            {
                key: '1',
                label: 'Lớp có môn theo KHGD',
                content: <FixedClass subjectClassId={subjectClassId} />,
            },
        ],
        '2': [
            {
                key: '1',
                label: 'Học viên có môn theo KHGD',
                content: <StudentCourseByPlan subjectClassId={subjectClassId} />,
            },
        ],
    }

    const renderRightTabs = () => {
        const rightTabs = rightTabsMap[activeLeftTab]
        if (!rightTabs) return null

        return (
            <Tabs defaultActiveKey="1">
                {rightTabs.map((tab) => (
                    <Tabs.TabPane tab={tab.label} key={tab.key}>
                        {tab.content}
                    </Tabs.TabPane>
                ))}
            </Tabs>
        )
    }

    return (
        <Row gutter={[1, 0]}>
            <Col span={24} className="!p-0">
                <Flex>
                    <Col span={activeLeftTab === '3' ? 24 : 14}>
                        <div className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4">
                            <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
                                {leftTabs.map((tab) => (
                                    <Tabs.TabPane tab={tab.label} key={tab.key}>
                                        {tab.content}
                                    </Tabs.TabPane>
                                ))}
                            </Tabs>
                        </div>
                    </Col>
                    {activeLeftTab !== '3' && (
                        <Col span={10}>
                            <div className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4">
                                {renderRightTabs()}
                            </div>
                        </Col>
                    )}
                </Flex>
            </Col>
        </Row>
    )
}

RegisterClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
