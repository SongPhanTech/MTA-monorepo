import { CardDashBoard } from "@components/commons/card-dashboard"
import type { WorkScheduleOverviewStats } from "@hooks/use-work-schedule-overview"
import { ROUTER_PATH } from "@workspace/router"
import { CalendarClock, CalendarDays, CalendarRange, ChartColumn, Clock3 } from "lucide-react"
import { Col, Row } from "antd"

type OverviewStatCardsProps = WorkScheduleOverviewStats

export function OverviewStatCards({
  todayEventCount,
  todayPeriodLabel,
  weekEventCount,
  weekPeriodLabel,
  monthEventCount,
  monthPeriodLabel,
  quarterEventCount,
  quarterPeriodLabel,
  upcoming7DaysEventCount,
  upcoming7DaysPeriodLabel,
}: OverviewStatCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={8} xxl={4}>
        <CardDashBoard
          icon={<CalendarDays size={14} />}
          title="Sự kiện hôm nay"
          content={todayEventCount}
          description={todayPeriodLabel}
          backgroundIcon="#fa8c16"
          href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_CONG_TAC}
        />
      </Col>
      <Col xs={24} sm={12} xl={8} xxl={5}>
        <CardDashBoard
          icon={<CalendarRange size={14} />}
          title="Sự kiện trong tuần"
          content={weekEventCount}
          description={weekPeriodLabel}
          backgroundIcon="#13ab55"
          href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN}
        />
      </Col>
      <Col xs={24} sm={12} xl={8} xxl={5}>
        <CardDashBoard
          icon={<CalendarClock size={14} />}
          title="Sự kiện trong tháng"
          content={monthEventCount}
          description={monthPeriodLabel}
          backgroundIcon="#1677ff"
          href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_THANG}
        />
      </Col>
      <Col xs={24} sm={12} xl={8} xxl={5}>
        <CardDashBoard
          icon={<ChartColumn size={14} />}
          title="Sự kiện trong quý"
          content={quarterEventCount}
          description={quarterPeriodLabel}
          backgroundIcon="#722ed1"
          href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_THANG}
        />
      </Col>
      <Col xs={24} sm={12} xl={8} xxl={5}>
        <CardDashBoard
          icon={<Clock3 size={14} />}
          title="Sắp diễn ra (7 ngày)"
          content={upcoming7DaysEventCount}
          description={upcoming7DaysPeriodLabel}
          backgroundIcon="#eb2f96"
          href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN}
        />
      </Col>
    </Row>
  )
}
