import { formatEventTime, getWeekDays, isSameDay } from "@/utils/work-schedule-week"
import type { WorkScheduleEventItem, WorkScheduleLeader } from "@/types/work-schedule"
import { Table, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useMemo } from "react"

const { Text } = Typography

type LeaderWeekMatrixProps = {
  weekStart: Date
  leaders: WorkScheduleLeader[]
  events: WorkScheduleEventItem[]
  loading?: boolean
}

type MatrixRow = {
  key: string
  dayLabel: string
  dayNumber: number
  date: Date
  isToday: boolean
}

export function LeaderWeekMatrix({
  weekStart,
  leaders,
  events,
  loading = false,
}: LeaderWeekMatrixProps) {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const dataSource = useMemo<MatrixRow[]>(
    () =>
      weekDays.map((day) => ({
        key: day.key,
        dayLabel: day.label,
        dayNumber: day.dayNumber,
        date: day.date,
        isToday: day.isToday,
      })),
    [weekDays]
  )

  const columns = useMemo<ColumnsType<MatrixRow>>(() => {
    const baseColumns: ColumnsType<MatrixRow> = [
      {
        title: "Thứ",
        dataIndex: "dayLabel",
        width: 70,
        align: "center",
        fixed: "left",
        render: (value: string, record) => (
          <Text strong={record.isToday} style={{ color: record.isToday ? "#1677ff" : undefined }}>
            {value}
          </Text>
        ),
      },
      {
        title: "Ngày",
        dataIndex: "dayNumber",
        width: 70,
        align: "center",
        fixed: "left",
        render: (value: number, record) => (
          <Text strong={record.isToday} style={{ color: record.isToday ? "#1677ff" : undefined }}>
            {value}
          </Text>
        ),
      },
    ]

    const leaderColumns: ColumnsType<MatrixRow> = leaders.map((leader) => ({
      title: (
        <div className="text-center leading-tight py-1">
          <div className="text-xs text-gray-500 font-normal">{leader.rankTitle}</div>
          <div className="font-semibold text-sm">{leader.fullName}</div>
        </div>
      ),
      key: leader.id,
      align: "left",
      render: (_value, record) => {
        const dayEvents = events.filter(
          (event) => event.leaderId === leader.id && isSameDay(event.classDate, record.date)
        )

        if (dayEvents.length === 0) {
          return <Text type="secondary">—</Text>
        }

        return (
          <ul className="list-none m-0 p-0 space-y-1">
            {dayEvents.map((event) => {
              const timeLabel = formatEventTime(event.startTime, event.endTime)
              return (
                <li key={event.id} className="text-sm leading-snug">
                  {timeLabel ? (
                    <Text strong style={{ color: "#1677ff" }}>
                      {timeLabel}.
                    </Text>
                  ) : null}{" "}
                  <span>{event.content}</span>
                  {event.location ? (
                    <div className="text-xs text-gray-500">{event.location}</div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )
      },
    }))

    return [...baseColumns, ...leaderColumns]
  }, [events, leaders])

  if (leaders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Chưa có Thủ trưởng Học viện. Vui lòng cấu hình danh mục TTHV trước khi xem lịch tổng hợp.
      </div>
    )
  }

  return (
    <Table<MatrixRow>
      bordered
      size="small"
      loading={loading}
      pagination={false}
      rowKey="key"
      scroll={{ x: Math.max(900, 180 + leaders.length * 220) }}
      columns={columns}
      dataSource={dataSource}
      rowClassName={(record) => (record.isToday ? "bg-blue-50/60" : "")}
    />
  )
}
