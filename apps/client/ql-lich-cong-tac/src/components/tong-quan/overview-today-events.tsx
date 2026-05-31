import type { WorkScheduleTodayEvent } from "@hooks/use-work-schedule-overview"
import { Empty, List, Tag, Typography } from "antd"

type OverviewTodayEventsProps = {
  events: WorkScheduleTodayEvent[]
}

export function OverviewTodayEvents({ events }: OverviewTodayEventsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 h-full">
      <Typography.Title level={5} className="!mb-3">
        Sự kiện sắp tới hôm nay
      </Typography.Title>

      {events.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có sự kiện hôm nay" />
      ) : (
        <List
          size="small"
          dataSource={events}
          renderItem={(event) => (
            <List.Item className="!px-0">
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="#13ab55">{event.timeLabel}</Tag>
                  <Typography.Text strong>{event.content}</Typography.Text>
                </div>
                <Typography.Text type="secondary" className="text-xs">
                  {event.leaderLabel}
                  {event.location ? ` • ${event.location}` : ""}
                </Typography.Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
