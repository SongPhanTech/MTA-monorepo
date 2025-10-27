import TabDotKhaoSat from "@components/sub-pages/khao-sat";
import TabDotKhaoSatCum from "@components/sub-pages/khat-sat-cum";
import DefaultLayout from "@layouts/default-layout";
import { Col, Row, Tabs } from "antd";
import { useState } from "react";


export default function SurveyPage() {
       const [activeKey, setActiveKey] = useState('1')

    const items = [
        {
            key: '1',
            label: 'Khảo sát chung',
            children: <TabDotKhaoSat />,
        },
        {
            key: '2',
            label: 'Khảo sát cụm',
            children: <TabDotKhaoSatCum/>,
        },
    ]

  return (
    <Row gutter={[16,16]}>
        <Col span={24}>
                <Tabs
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                items={items}
            />
        </Col>
    </Row>
  )
}
SurveyPage.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}