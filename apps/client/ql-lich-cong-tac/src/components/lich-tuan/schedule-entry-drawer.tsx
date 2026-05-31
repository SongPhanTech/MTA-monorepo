import { getWeekScheduleEntryTypeMeta } from "@constants/work-schedule-week-mock"
import { ROUTER_PATH } from "@workspace/router"
import type { WeekScheduleEntry, WeekScheduleLeader } from "@/types/work-schedule-week-view"
import { formatWorkDayLabel } from "@/utils/work-schedule-week"
import { Button, Descriptions, Drawer, Space, Tag } from "antd"
import Link from "next/link"

type ScheduleEntryDrawerProps = {
  open: boolean
  entry: WeekScheduleEntry | null
  leader: WeekScheduleLeader | null
  onClose: () => void
}

export function ScheduleEntryDrawer({ open, entry, leader, onClose }: ScheduleEntryDrawerProps) {
  if (!entry) {
    return (
      <Drawer title="Chi tiết lịch" open={open} onClose={onClose} width={480}>
        <div />
      </Drawer>
    )
  }

  const typeMeta = getWeekScheduleEntryTypeMeta(entry.type)
  const isDraft = entry.publishStatus === "DRAFT"

  return (
    <Drawer
      title="Chi tiết lịch công tác"
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Link href={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_CONG_TAC}>
          <Button type="primary" className="!bg-[#13ab55] hover:!bg-[#10994d]">
            Sửa lịch
          </Button>
        </Link>
      }
    >
      <Space direction="vertical" size="middle" className="w-full">
        <Space wrap>
          <Tag color={typeMeta.dotColor}>{typeMeta.label}</Tag>
          {isDraft ? (
            <Tag color="gold" bordered={false}>
              Nháp
            </Tag>
          ) : (
            <Tag color="#13ab55" bordered={false}>
              Đã công bố
            </Tag>
          )}
        </Space>

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Thủ trưởng">
            {leader ? `${leader.rankTitle} ${leader.fullName}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày">{formatWorkDayLabel(entry.date)}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">{entry.time || "Cả ngày"}</Descriptions.Item>
          <Descriptions.Item label="Nội dung">{entry.content}</Descriptions.Item>
          {entry.location ? (
            <Descriptions.Item label="Địa điểm">{entry.location}</Descriptions.Item>
          ) : null}
        </Descriptions>
      </Space>
    </Drawer>
  )
}
