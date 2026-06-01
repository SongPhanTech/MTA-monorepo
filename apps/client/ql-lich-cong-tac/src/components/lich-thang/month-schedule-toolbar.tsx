import { CUSTOM_VI_LOCALE } from "@constants/constants"
import { formatMonthPeriodLabel } from "@/utils/work-schedule-month"
import { CalendarOutlined, LeftOutlined, PrinterOutlined, RightOutlined } from "@ant-design/icons"
import { Button, DatePicker, Space, Tag, Typography } from "antd"
import dayjs from "dayjs"

const { Text } = Typography

type MonthScheduleToolbarProps = {
  monthStart: Date
  monthEnd: Date
  eventCount: number
  onPreviousMonth: () => void
  onNextMonth: () => void
  onCurrentMonth: () => void
  onPickMonth: (monthOffset: number) => void
  onPrint?: () => void
}

export function MonthScheduleToolbar({
  monthStart,
  monthEnd,
  eventCount,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  onPickMonth,
  onPrint,
}: MonthScheduleToolbarProps) {
  return (
    <div className="week-schedule-toolbar">
      <Space wrap>
        <Text type="secondary" className="text-sm">
          {formatMonthPeriodLabel(monthStart, monthEnd)}
        </Text>
        <Tag color="#13ab55" className="!m-0">
          {eventCount} sự kiện
        </Tag>
      </Space>

      <Space wrap>
        <Button icon={<LeftOutlined />} onClick={onPreviousMonth}>
          Tháng trước
        </Button>

        <DatePicker
          picker="month"
          allowClear={false}
          locale={CUSTOM_VI_LOCALE as never}
          value={dayjs(monthStart)}
          format="MM/YYYY"
          suffixIcon={<CalendarOutlined className="text-[#13ab55]" />}
          onChange={(value) => {
            if (!value) return
            const offset = value.startOf("month").diff(dayjs().startOf("month"), "month")
            onPickMonth(offset)
          }}
        />

        <Button
          type="primary"
          className="!bg-[#13ab55] hover:!bg-[#10994d]"
          onClick={onCurrentMonth}
        >
          Hôm nay
        </Button>

        <Button icon={<RightOutlined />} onClick={onNextMonth}>
          Tháng sau
        </Button>

        <Button icon={<PrinterOutlined />} onClick={onPrint}>
          In lịch tháng
        </Button>
      </Space>
    </div>
  )
}
