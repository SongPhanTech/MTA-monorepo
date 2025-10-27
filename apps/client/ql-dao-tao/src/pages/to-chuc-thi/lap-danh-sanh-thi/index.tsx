import DefaultLayout from '@layouts/default-layout'

import { Col, Row, Tabs } from 'antd'
import DanhSachKeHoachThi from './_components/danh-sach-ke-hoach-thi'
import DanhSachSinhVien from './_components/danh-sach-sinh-vien'
import { useState } from 'react'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function LapDanhSachThiPage() {
    const [selectedSubjectClassId, setSelectedSubjectClassId] = useState<string | null>(null)

    const tabItems: TabItem[] = [
        {
            key: '1',
            label: 'Danh sách kế hoạch thi',
            content: <DanhSachKeHoachThi onSelectSubjectClass={setSelectedSubjectClassId} />,
        },
        {
            key: '2',
            label: 'Danh sách sinh viên',
            content: <DanhSachSinhVien subjectClassId={selectedSubjectClassId} />,
        },
    ]

    return (
        <Row gutter={[12, 0]} className="bg-white">
            <Col span={24}>
                <Tabs defaultActiveKey="1">
                    {tabItems.map((tab) => (
                        <Tabs.TabPane tab={tab.label} key={tab.key}>
                            {tab.content}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </Col>
        </Row>
    )
}

LapDanhSachThiPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
