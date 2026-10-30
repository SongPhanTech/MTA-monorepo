import DefaultLayout from "@layouts/default-layout"
import { $Enums } from "@workspace/db/client"
import { Col, Row, Tabs, Tooltip } from "antd"
import type React from "react"
import { useState } from "react"
import MonCham from "./_components/mon-cham"
import MonCoHVSVChuaDat from "./_components/mon-co-hvsv-chua-dat"
import MonDaLapKeHoach from "./_components/mon-da-lap-ke-hoach"
import MonKySau from "./_components/mon-ky-sau"
import MonTheoKeHoachDuKien from "./_components/mon-theo-ke-hoach-du-kien"

interface TabItem {
  key: string
  label: string | React.ReactNode
  content: React.ReactNode
}

export default function LapKeHoach({ type }: { type?: $Enums.SubjectClassType }) {
  const [activeLeftTab, setActiveLeftTab] = useState("1")

  const leftTabs: TabItem[] =
    type !== $Enums.SubjectClassType.NORMAL
      ? [
          {
            key: "1",
            label: "Môn có SV/HV chưa đạt",
            content: <MonCoHVSVChuaDat type={type} />,
          },
        ]
      : [
          {
            key: "1",
            label: <Tooltip title="Môn theo học kỳ dự kiến">Môn theo HKDK</Tooltip>,
            content: <MonTheoKeHoachDuKien />,
          },
          {
            key: "2",
            label: "Môn học chậm tiến độ",
            content: <MonCham />,
          },
          {
            key: "3",
            label: "Môn học kỳ sau",
            content: <MonKySau />,
          },
        ]

  const rightTabsMap: TabItem[] = [
    {
      key: "1",
      label: "Môn học dự kiến giảng dạy",
      content: <MonDaLapKeHoach type={type} />,
    },
  ]

  return (
    <Row gutter={[8, 0]}>
      <Col span={14}>
        <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab} destroyInactiveTabPane>
          {leftTabs.map((tab) => (
            <Tabs.TabPane tab={tab.label} key={tab.key}>
              {tab.content}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </Col>
      <Col span={10}>
        <Tabs defaultActiveKey="1">
          {rightTabsMap.map((tab) => (
            <Tabs.TabPane tab={tab.label} key={tab.key}>
              {tab.content}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </Col>
    </Row>
  )
}

LapKeHoach.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
