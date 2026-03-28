import ContentFacilities from "@components/features/tieu-chuan-tieu-chi/content-facilities"
import SidebarStandardSet from "@components/features/tieu-chuan-tieu-chi/sidebar"
import { Col, Row } from "antd"

export default function Facilities() {
  return (
    <Row gutter={[8, 0]}>
      <Col xs={0} sm={0} md={7} lg={6} xl={5}>
        <SidebarStandardSet objectType="ASSET" />
      </Col>
      <Col xs={24} sm={24} md={17} lg={18} xl={19}>
        <ContentFacilities />
      </Col>
    </Row>
  )
}
