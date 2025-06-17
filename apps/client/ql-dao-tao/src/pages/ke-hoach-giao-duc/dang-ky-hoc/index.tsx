import DefaultLayout from '@layouts/default-layout'
import { Col, Flex, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import RegisterClassManager from './components/dang-ky-hoc-cho-lop-quan-ly'
import FixedClass from './components/lop-co-mon-theo-khgd'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function RegisterClass() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const [semesterId, setSemesterId] = useState<string | null>(null)
    const [subjectClassId, setSubjectClassId] = useState<string | null>(null)

    const leftTabs: TabItem[] = [
        {
            key: '1',
            label: 'Đăng ký học cho lớp quản lý',
            content: (
                <RegisterClassManager
                    setSemesterId={setSemesterId}
                    setSubjectClassId={setSubjectClassId}
                />
            ),
        },
        {
            key: '2',
            label: 'Đăng ký học cho cá nhân',
            content: <RegisterClassManager />,
        },
        {
            key: '3',
            label: 'Kết quả đăng ký học lớp quản lý',
            content: <p>Xem kết quả đăng ký học của lớp quản lý</p>,
        },
    ]

    const rightTabsMap: Record<string, TabItem[]> = {
        '1': [
            {
                key: '1',
                label: 'Lớp có môn theo KHGD',
                content: (
                    <FixedClass
                        semesterId={semesterId}
                        subjectClassId={subjectClassId}
                    />
                ),
            },
            {
                key: '2',
                label: 'Lớp đăng ký thiếu',
                content: <p>Lớp đăng ký thiếu</p>,
            },
        ],
        '2': [
            {
                key: '1',
                label: 'Học viên có môn theo KHGD',
                content: <p>Học viên có môn theo KHGD</p>,
            },
            {
                key: '2',
                label: 'Lớp đăng ký thiếu',
                content: <p>Lớp đăng ký thiếu</p>,
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
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Flex gap={8}>
                    <Col span={activeLeftTab === '3' ? 24 : 14}>
                        <Tabs
                            activeKey={activeLeftTab}
                            onChange={setActiveLeftTab}
                        >
                            {leftTabs.map((tab) => (
                                <Tabs.TabPane tab={tab.label} key={tab.key}>
                                    {tab.content}
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </Col>

                    {activeLeftTab !== '3' && (
                        <Col span={10}>{renderRightTabs()}</Col>
                    )}
                </Flex>
            </Col>
        </Row>
    )
}

RegisterClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
