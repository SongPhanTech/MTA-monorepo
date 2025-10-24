import NhapdiemPhach from '@components/sub-pages/nhap-diem-phach'
import SinhPhach from '@components/sub-pages/sinh-phach'
import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function SubjectClassScore() {
    const router = useRouter()
    const [activeKey, setActiveKey] = useState('1')
    const examRoomId = router.query.examRoomId as string
    const items = useMemo(() => {
        return [
            {
                label: 'QL phách',
                key: '1',
                children: <SinhPhach />,
            },
            {
                label: 'Nhập điểm',
                key: '2',
                children: <NhapdiemPhach />,
            },
        ]
    }, [])

    return (
        <div className="bg-white">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Tabs
                        activeKey={activeKey}
                        onChange={(key) => setActiveKey(key)}
                        items={items}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
