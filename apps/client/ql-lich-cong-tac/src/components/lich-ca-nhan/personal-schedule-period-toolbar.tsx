import { CUSTOM_VI_LOCALE } from "@constants/constants"
import type { PersonalSchedulePeriodType } from "@/types/personal-schedule"
import { formatMonthPeriodLabel } from "@/utils/work-schedule-month"
import { formatWeekRangeLabel } from "@/utils/work-schedule-week"
import { CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, DatePicker, Segmented, Space, Typography } from "antd"
import dayjs from "dayjs"

const { Text } = Typography

type PersonalSchedulePeriodToolbarProps = {
  periodType: PersonalSchedulePeriodType
  periodStart: Date
  periodEnd: Date
  onChangePeriodType: (type: PersonalSchedulePeriodType) => void
  onPreviousPeriod: () => void
  onNextPeriod: () => void
  onPickPeriod: (date: dayjs.Dayjs | null) => void
  embedded?: boolean
}

export function PersonalSchedulePeriodToolbar({
  periodType,
  periodStart,
  periodEnd,
  onChangePeriodType,
  onPreviousPeriod,
  onNextPeriod,
  onPickPeriod,
  embedded = false,
}: PersonalSchedulePeriodToolbarProps) {
  const periodLabel =
    periodType === "week"
      ? formatWeekRangeLabel(periodStart, periodEnd)
      : formatMonthPeriodLabel(periodStart, periodEnd)

  return (
    <div
      className={
        embedded ? "personal-schedule-period-toolbar personal-schedule-period-toolbar--embedded" : "personal-schedule-period-toolbar"
      }
    >
      <Segmented
        value={periodType}
        onChange={(value) => onChangePeriodType(value as PersonalSchedulePeriodType)}
        options={[
          { label: "Theo tuần", value: "week" },
          { label: "Theo tháng", value: "month" },
        ]}
      />

      <Space wrap className="personal-schedule-period-actions">
        <Button icon={<LeftOutlined />} onClick={onPreviousPeriod}>
          {periodType === "week" ? "Tuần trước" : "Tháng trước"}
        </Button>

        {periodType === "week" ? (
          <DatePicker
            picker="week"
            allowClear={false}
            locale={CUSTOM_VI_LOCALE as never}
            value={dayjs(periodStart)}
            format={`DD/MM/YYYY - ${dayjs(periodEnd).format("DD/MM/YYYY")}`}
            suffixIcon={<CalendarOutlined className="text-[#13ab55]" />}
            onChange={onPickPeriod}
          />
        ) : (
          <DatePicker
            picker="month"
            allowClear={false}
            locale={CUSTOM_VI_LOCALE as never}
            value={dayjs(periodStart)}
            format="MM/YYYY"
            suffixIcon={<CalendarOutlined className="text-[#13ab55]" />}
            onChange={onPickPeriod}
          />
        )}

        <Button icon={<RightOutlined />} onClick={onNextPeriod}>
          {periodType === "week" ? "Tuần sau" : "Tháng sau"}
        </Button>

        <Text strong className="personal-schedule-period-label text-sm">
          {periodLabel}
        </Text>
      </Space>
    </div>
  )
}
