import DefaultLayout from '@layouts/default-layout'
import { Col, Flex, Row, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import type React from 'react'
import { useState } from 'react'
import RegisterClassManager from './components/dang-ky-hoc-cho-lop-quan-ly'
import FixedClass from './components/lop-co-mon-theo-khgd'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

const leftTabs: TabItem[] = [
    {
        key: '1',
        label: 'Đăng ký học cho lớp quản lý',
        content: <RegisterClassManager />,
    },
    {
        key: '2',
        label: 'Đăng ký học cho cá nhân',
        content: <p>Đăng ký môn học cho cá nhân</p>,
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
            content: <FixedClass />,
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
    ],
}

export default function RegisterClass() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')

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
        <div>
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
        </div>
    )
}

RegisterClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
