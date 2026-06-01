import { CUSTOM_VI_LOCALE } from "@constants/constants"
import { formatWeekRangeLabel } from "@/utils/work-schedule-week"
import { CalendarOutlined, LeftOutlined, PrinterOutlined, RightOutlined } from "@ant-design/icons"
import { Button, DatePicker, Space, Typography } from "antd"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

const { Text } = Typography

type WeekScheduleToolbarProps = {
  weekStart: Date
  weekEnd: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
  onPickWeek: (weekOffset: number) => void
  onPrint?: () => void
}

export function WeekScheduleToolbar({
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onPickWeek,
  onPrint,
}: WeekScheduleToolbarProps) {
  return (
    <div className="week-schedule-toolbar">
      <Text type="secondary" className="text-sm">
        {formatWeekRangeLabel(weekStart, weekEnd)}
      </Text>

      <Space wrap>
        <Button icon={<LeftOutlined />} onClick={onPreviousWeek}>
          Tuần trước
        </Button>

        <DatePicker
          picker="week"
          allowClear={false}
          locale={CUSTOM_VI_LOCALE as never}
          value={dayjs(weekStart)}
          format={`DD/MM/YYYY - ${dayjs(weekEnd).format("DD/MM/YYYY")}`}
          suffixIcon={<CalendarOutlined className="text-[#13ab55]" />}
          onChange={(value) => {
            if (!value) return
            const offset = value.startOf("isoWeek").diff(dayjs().startOf("isoWeek"), "week")
            onPickWeek(offset)
          }}
        />

        <Button
          type="primary"
          className="!bg-[#13ab55] hover:!bg-[#10994d]"
          onClick={onCurrentWeek}
        >
          Hôm nay
        </Button>

        <Button icon={<RightOutlined />} onClick={onNextWeek}>
          Tuần sau
        </Button>

        <Button icon={<PrinterOutlined />} onClick={onPrint}>
          In lịch tuần
        </Button>
      </Space>
    </div>
  )
}
