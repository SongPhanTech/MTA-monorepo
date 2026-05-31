import DatePicker from "@components/commons/date-picker"
import { getEventTypeMeta } from "@constants/work-schedule-form-mock"
import type { WorkSchedulePreviewEvent } from "@/types/work-schedule-form"
import { formatWorkDayLabel } from "@/utils/work-schedule-week"
import {
  CalendarOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { Button, Empty, Select, Tag, Typography } from "antd"
import type { Dayjs } from "dayjs"
import "./schedule-preview-timeline.css"

type SchedulePreviewTimelineProps = {
  previewDate: Dayjs
  events: WorkSchedulePreviewEvent[]
  onPreviousDay: () => void
  onNextDay: () => void
  onSelectDate: (date: Dayjs | null) => void
  onGoToday: () => void
}

export function SchedulePreviewTimeline({
  previewDate,
  events,
  onPreviousDay,
  onNextDay,
  onSelectDate,
  onGoToday,
}: SchedulePreviewTimelineProps) {
  return (
    <div className="schedule-preview rounded-lg border border-gray-200 bg-white p-5 h-full">
      <Typography.Title level={5} className="!mb-4 !text-[#13ab55] uppercase tracking-wide">
        Xem trước lịch
      </Typography.Title>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button icon={<LeftOutlined />} onClick={onPreviousDay} />
          <DatePicker
            allowClear={false}
            format={(value) => formatWorkDayLabel(value)}
            value={previewDate}
            onChange={onSelectDate}
            suffixIcon={<CalendarOutlined />}
          />
          <Button icon={<RightOutlined />} onClick={onNextDay} />
          <Button type="link" onClick={onGoToday}>
            Hôm nay
          </Button>
        </div>

        <Select
          defaultValue="day"
          style={{ width: 160 }}
          options={[
            { value: "day", label: "Xem theo ngày" },
            { value: "week", label: "Xem theo tuần" },
            { value: "month", label: "Xem theo tháng" },
          ]}
        />
      </div>

      {events.length === 0 ? (
        <Empty description="Không có lịch công tác trong ngày này" />
      ) : (
        <div className="schedule-preview__timeline">
          {events.map((event, index) => {
            const typeMeta = getEventTypeMeta(event.type)

            return (
              <div key={event.id} className="schedule-preview__item">
                <div className="schedule-preview__time">
                  <span>{event.startTime}</span>
                  {index < events.length - 1 ? <span className="text-gray-400">{event.endTime}</span> : null}
                </div>

                <div className="schedule-preview__axis">
                  <span
                    className="schedule-preview__dot"
                    style={{ backgroundColor: typeMeta.color }}
                  />
                  {index < events.length - 1 ? <span className="schedule-preview__line" /> : null}
                </div>

                <div
                  className="schedule-preview__card"
                  style={{
                    borderColor: typeMeta.color,
                    backgroundColor: typeMeta.background,
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="mt-1 text-base font-semibold text-gray-900">{event.title}</div>
                    </div>
                    <Tag color={typeMeta.color} className="!m-0">
                      {typeMeta.label}
                    </Tag>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <EnvironmentOutlined />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamOutlined />
                      <span>Thành phần: {event.participantCount} người</span>
                    </div>
                  </div>

                  {event.isDraft ? (
                    <Tag className="!mt-2" color="gold">
                      Đang soạn
                    </Tag>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* <Typography.Text type="secondary" className="mt-4 block text-xs">
        Dữ liệu xem trước: {previewDate.format("dddd, DD/MM/YYYY")}
      </Typography.Text> */}
    </div>
  )
}
