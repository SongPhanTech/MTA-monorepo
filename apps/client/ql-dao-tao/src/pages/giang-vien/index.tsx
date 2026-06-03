import DanhSachLopGiangVien from "@components/sub-pages/danh-sach-lop-giang-vien"
import GiangVienLayout from "@layouts/giang-vien-layout"
import { useSession } from "@workspace/auth/react"
import { DanhSachThongBao, LichCongTac } from "@workspace/ui"
import { Col, Row, Typography } from "antd"

const { Title } = Typography

function GiangVienPage() {
  const { data: me } = useSession()

  return (
    <div>
      <Title level={4} className="!mb-1">
        Xin chào{me?.fullName ? `, ${me.fullName}` : ""}!
      </Title>

      <Row gutter={[8, 8]}>
        <Col span={24}>
          <DanhSachLopGiangVien />
        </Col>

        <Col xs={24} lg={16}>
          <div className="bg-white rounded shadow h-full flex flex-col">
            <div className="px-4">
              <Title level={5}>Thời khoá biểu</Title>
            </div>
            <div className="flex-1 px-2">
              <LichCongTac onlyMySchedule />
            </div>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="bg-white rounded shadow h-full flex flex-col">
            <div className="px-4">
              <Title level={5}>Thông báo</Title>
            </div>
            <div className="flex-1 overflow-y-auto mb-2 px-2">
              <DanhSachThongBao />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default GiangVienPage

GiangVienPage.getLayout = function getLayout(page: React.ReactElement) {
  return <GiangVienLayout unLayout>{page}</GiangVienLayout>
}
