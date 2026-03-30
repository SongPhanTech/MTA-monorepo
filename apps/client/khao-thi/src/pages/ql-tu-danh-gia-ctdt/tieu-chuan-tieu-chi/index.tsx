import EvaluateLayout from "@layouts/evaluate-layout"
import Facilities from "@pages/ql-tu-danh-gia-ctdt/tieu-chuan-tieu-chi/_components/facilities"
import TrainingProgram from "@pages/ql-tu-danh-gia-ctdt/tieu-chuan-tieu-chi/_components/training-program"
import { Col, Row, Tabs } from "antd"
import type { TabsProps } from "antd/lib"
import { useMemo, useState } from "react"
export default function StandardCatalogPage() {
  const [activeKey, setActiveKey] = useState("1")

  const tabItems: TabsProps["items"] = useMemo(
    () => [
      {
        key: "1",
        label: "Chương trình đào tạo",
        children: <TrainingProgram />,
      },
      {
        key: "2",
        label: "Cơ sở giáo dục",
        children: <Facilities />,
      },
    ],
    []
  )

  return (
    <Row gutter={[12, 0]}>
      <Col span={24}>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
          destroyOnHidden={false}
        />
      </Col>
    </Row>
  )
}

StandardCatalogPage.getLayout = function getLayout(page: React.ReactElement) {
  return <EvaluateLayout>{page}</EvaluateLayout>
}
