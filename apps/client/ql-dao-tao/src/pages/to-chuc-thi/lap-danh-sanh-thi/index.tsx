import DefaultLayout from '@layouts/default-layout'
import { Store } from '@tanstack/react-store'
import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import DanhSachKeHoachThi from './_components/danh-sach-ke-hoach-thi'
import DanhSachSinhVien from './_components/danh-sach-sinh-vien'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export type keHoachThiStoreState = {
    selectedExamId?: string
}

export const keHoachThiStore = new Store<keHoachThiStoreState>({
    selectedExamId: undefined,
})

export default function LapDanhSachThiPage() {
    const [activeKey, setActiveKey] = useState('1')

    const tabItems = useMemo(() => {
        return [
            {
                key: '1',
                label: 'Danh sách kế hoạch thi',
                children: <DanhSachKeHoachThi setActiveKey={setActiveKey} />,
            },
            {
                key: '2',
                label: 'Danh sách sinh viên',
                children: <DanhSachSinhVien />,
            },
        ]
    }, [])

    return (
        <Row gutter={[12, 0]} className="bg-white">
            <Col span={24}>
                <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
            </Col>
        </Row>
    )
}

LapDanhSachThiPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
