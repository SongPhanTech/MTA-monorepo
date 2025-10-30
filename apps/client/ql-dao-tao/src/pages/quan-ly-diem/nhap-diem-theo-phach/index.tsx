import NhapdiemPhach from '@components/sub-pages/nhap-diem-phach'
import PhongThi from '@components/sub-pages/ql-phong-thi'
import SinhPhach from '@components/sub-pages/sinh-phach'
import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function SubjectClassScoreTheoPhach() {
    const router = useRouter()
    const [selectedRowKeys, setSelectedRowKeys] = useState<string>('')
    const [activeKey, setActiveKey] = useState('1')

    // biome-ignore lint/correctness/useExhaustiveDependencies: <skip>
    const items = useMemo(() => {
        return [
            {
                label: 'QL Phòng thi',
                key: '1',
                children: (
                    <PhongThi
                        selectedRowKeys={selectedRowKeys}
                        setSelectedRowKeys={(value: string) => {
                            setSelectedRowKeys(value)
                        }}
                    />
                ),
            },
            {
                label: 'QL phách',
                key: '2',
                disabled: !selectedRowKeys,
                children: <SinhPhach examRoomId={selectedRowKeys} />,
            },
            {
                label: 'Nhập điểm',
                key: '3',
                disabled: !selectedRowKeys,
                children: <NhapdiemPhach examRoomId={selectedRowKeys} />,
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

SubjectClassScoreTheoPhach.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
