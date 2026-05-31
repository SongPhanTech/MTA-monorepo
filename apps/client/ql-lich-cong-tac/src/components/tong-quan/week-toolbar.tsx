import { CUSTOM_VI_LOCALE } from "@constants/constants"
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { formatWeekRangeLabel } from "@/utils/work-schedule-week"
import { Button, Col, DatePicker, Row, Typography } from "antd"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

const { Title, Text } = Typography

type WeekToolbarProps = {
  weekStart: Date
  weekEnd: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
  onPickWeek: (weekOffset: number) => void
}

export function WeekToolbar({
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onPickWeek,
}: WeekToolbarProps) {
  return (
    <Row gutter={[16, 12]} align="middle" justify="space-between">
      <Col>
        <Title level={4} className="!mb-1">
          Lịch công tác tuần
        </Title>
        <Text type="secondary">{formatWeekRangeLabel(weekStart, weekEnd)}</Text>
      </Col>
      <Col>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={onPreviousWeek}>
            Tuần trước
          </Button>
          <DatePicker
            picker="week"
            locale={CUSTOM_VI_LOCALE as never}
            value={dayjs(weekStart)}
            onChange={(value) => {
              if (!value) return
              const offset = value.startOf("isoWeek").diff(dayjs().startOf("isoWeek"), "week")
              onPickWeek(offset)
            }}
          />
          <Button onClick={onCurrentWeek}>Tuần này</Button>
          <Button icon={<ArrowRightOutlined />} iconPosition="end" onClick={onNextWeek}>
            Tuần sau
          </Button>
        </div>
      </Col>
    </Row>
  )
}
