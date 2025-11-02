import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import DanhSachKeHoachThi from './_components/danh-sach-ke-hoach-thi'
import DanhSachSinhVien from './_components/danh-sach-sinh-vien'
import { useMemo, useState } from 'react'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function LapDanhSachThiPage() {
    const [selectedSubjectClassId, setSelectedSubjectClassId] = useState<string | null>(null)
    const [activeKey, setActiveKey] = useState('1')

    const tabItems = useMemo(() => {
        return [
            {
                key: '1',
                label: 'Danh sách kế hoạch thi',
                children: (
                    <DanhSachKeHoachThi
                        onSelectSubjectClass={setSelectedSubjectClassId}
                        setActiveKey={setActiveKey}
                    />
                ),
            },
            {
                key: '2',
                label: 'Danh sách sinh viên',
                children: <DanhSachSinhVien subjectClassId={selectedSubjectClassId} />,
            },
        ]
    }, [selectedSubjectClassId])

    return (
        <Row gutter={[12, 0]} className="bg-white">
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

LapDanhSachThiPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
