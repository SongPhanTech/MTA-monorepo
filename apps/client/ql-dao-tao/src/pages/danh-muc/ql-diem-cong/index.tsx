import DefaultLayout from "@layouts/default-layout"
import { Col, Row, Tabs } from "antd"
import type React from "react"
import { useState } from "react"
import ArchivedCertificate from "./components/certificate"
import OlympicAwards from "./components/olympic-award"

interface TabItem {
  key: string
  label: string
  content: React.ReactNode
}
export default function ClassSubject() {
  const [activeLeftTab, setActiveLeftTab] = useState("1")
  const leftTabs: TabItem[] = [
    {
      key: "1",
      label: "Điểm olympic",
      content: <OlympicAwards />,
    },
    {
      key: "2",
      label: "Chứng chỉ",
      content: <ArchivedCertificate />,
    },
  ]
  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <div className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm px-4">
            <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
              {leftTabs.map((tab) => (
                <Tabs.TabPane tab={tab.label} key={tab.key}>
                  {tab.content}
                </Tabs.TabPane>
              ))}
            </Tabs>
          </div>
        </Col>
      </Row>
    </div>
  )
}

ClassSubject.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
