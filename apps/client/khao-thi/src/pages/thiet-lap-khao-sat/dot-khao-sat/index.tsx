import TabDotKhaoSat from "@components/sub-pages/khao-sat"
import SurveyReport from "@components/sub-pages/khao-sat/bao-cao"
import DanhSachDoiTuong from "@components/sub-pages/khao-sat/danh-sach-dt-lam-khao-sat"
import SurveyEssay from "@components/sub-pages/khao-sat/liet-ke"
import DefaultLayout from "@layouts/default-layout"
import type { Survey } from "@workspace/db/client"
import { Col, Row, Tabs } from "antd"
import { useState } from "react"
import SurveyToFieldReport from "@components/sub-pages/khao-sat/bao-cao-theo-linh-vuc"

export default function SurveyPage() {
  const [activeKey, setActiveKey] = useState("1")
  const [selectedId, setSelectedId] = useState<Survey | null>(null)

  const items = [
    {
      key: "1",
      label: "Đợt khảo sát",
      children: (
        <TabDotKhaoSat
          selectedId={selectedId}
          setSelectedId={(value) => {
            setSelectedId(value)
          }}
        />
      ),
    },
    {
      key: "2",
      label: "Danh sách người làm khảo sát",
      children: <DanhSachDoiTuong selectedId={selectedId} />,
      disabled: !selectedId?.id,
    },
    {
      key: "3",
      label: "Báo cáo khảo sát",
      children: <SurveyReport selectedId={selectedId?.id || ""} />,
      disabled: !selectedId?.id,
    },
    {
      key: "5",
      label: "Báo cáo theo lĩnh vực",
      children: <SurveyToFieldReport selectedId={selectedId?.id || ""} />,
      disabled: !selectedId?.id,
    },
    {
      key: "4",
      label: "Liệt kê câu hỏi tự luận",
      children: <SurveyEssay selectedId={selectedId?.id || ""} />,
      disabled: !selectedId?.id,
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
      </Col>
    </Row>
  )
}
SurveyPage.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
