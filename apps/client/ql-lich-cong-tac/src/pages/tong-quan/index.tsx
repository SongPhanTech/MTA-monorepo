import { OverviewQuickLinks } from "@components/tong-quan/overview-quick-links"
import { OverviewStatCards } from "@components/tong-quan/overview-stat-cards"
import { OverviewTodayEvents } from "@components/tong-quan/overview-today-events"
import DefaultLayout from "@layouts/default-layout"
import { useWorkScheduleOverview } from "@hooks/use-work-schedule-overview"
import { DanhSachThongBao } from "@workspace/ui"
import { Col, Divider, Row, Typography } from "antd"
import type React from "react"

function TongQuanPage() {
  const { stats, todayUpcomingEvents } = useWorkScheduleOverview()

  return (
    <div className="space-y-4">
      <div>
        <Typography.Title level={4} className="!mb-1">
          Tổng quan lịch công tác
        </Typography.Title>
        <Typography.Text type="secondary">
          Thống kê nhanh số lượng sự kiện theo ngày, tuần, tháng và quý
        </Typography.Text>
      </div>

      <OverviewStatCards {...stats} />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <OverviewTodayEvents events={todayUpcomingEvents} />
        </Col>

        <Col xs={24} xl={14}>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <Typography.Title level={5} className="!mb-3">
              Truy cập nhanh
            </Typography.Title>
            <OverviewQuickLinks />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <Typography.Title level={5}>Thông báo</Typography.Title>
            <Divider className="!my-3" />
            <DanhSachThongBao />
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default TongQuanPage

TongQuanPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
