import type {
  WeekScheduleEntry,
  WeekScheduleEntryTypeMeta,
  WeekScheduleLeader,
} from "@/types/work-schedule-week-view"

export const MOCK_WEEK_START = "2026-05-25"

export const WEEK_SCHEDULE_LEADERS: WeekScheduleLeader[] = [
  { id: "w-leader-1", rankTitle: "Giám đốc", fullName: "Lê Minh Thái", sortOrder: 1 },
  { id: "w-leader-2", rankTitle: "Chính ủy", fullName: "Trần Văn Thương", sortOrder: 2 },
  { id: "w-leader-3", rankTitle: "Phó giám đốc", fullName: "Trần Xuân Nam", sortOrder: 3 },
  { id: "w-leader-4", rankTitle: "Phó giám đốc", fullName: "Mai Quang Huy", sortOrder: 4 },
]

export const WEEK_SCHEDULE_ENTRY_TYPES: WeekScheduleEntryTypeMeta[] = [
  {
    type: "ORIGINAL",
    label: "Lịch ban đầu",
    dotColor: "#262626",
    description: "Lịch công tác theo kế hoạch",
  },
  {
    type: "SUPPLEMENT",
    label: "Lịch bổ sung/phát sinh",
    dotColor: "#722ed1",
    description: "Lịch phát sinh trong tuần",
  },
  {
    type: "DUTY",
    label: "Lịch trực chỉ huy học viện",
    dotColor: "#cf1322",
    description: "Ca trực Ban Giám đốc",
  },
  {
    type: "PARTICIPANT",
    label: "Các thành viên tham gia",
    dotColor: "#d4b896",
    description: "Họp/làm việc có nhiều thành phần",
  },
]

export const MOCK_WEEK_SCHEDULE_ENTRIES: WeekScheduleEntry[] = [
  {
    id: "we-1",
    leaderId: "w-leader-1",
    date: "2026-05-25",
    content: "Đi công tác Hàn Quốc, Nhật Bản (21/05-30/05)",
    type: "ORIGINAL",
  },
  {
    id: "we-2",
    leaderId: "w-leader-4",
    date: "2026-05-25",
    time: "07:00",
    content: "Trực BGĐ",
    type: "DUTY",
  },
  {
    id: "we-3",
    leaderId: "w-leader-2",
    date: "2026-05-26",
    time: "8h00",
    content: "Hội nghị giao ban BQP tháng 5/2026 (P405-S1)",
    type: "PARTICIPANT",
  },
  {
    id: "we-4",
    leaderId: "w-leader-2",
    date: "2026-05-26",
    time: "14h00",
    content: "Giao ban công tác đào tạo tháng 5/2026 (P715 - S4)",
    location: "P715 - S4",
    type: "SUPPLEMENT",
    publishStatus: "DRAFT",
  },
  {
    id: "we-5",
    leaderId: "w-leader-3",
    date: "2026-05-27",
    time: "7h30",
    content: "Giao ban học viện (HT - S4)",
    type: "PARTICIPANT",
  },
  {
    id: "we-6",
    leaderId: "w-leader-1",
    date: "2026-05-28",
    time: "09:00",
    content: "Làm việc online với đoàn công tác (VP Học viện)",
    type: "ORIGINAL",
  },
  {
    id: "we-7",
    leaderId: "w-leader-3",
    date: "2026-05-28",
    time: "14:00",
    content: "Họp rà soát kế hoạch đào tạo quý III (P301)",
    location: "P301",
    type: "SUPPLEMENT",
    publishStatus: "DRAFT",
  },
  {
    id: "we-8",
    leaderId: "w-leader-4",
    date: "2026-05-29",
    time: "08:30",
    content: "Tiếp đoàn kiểm tra liên ngành (Hội trường A)",
    type: "PARTICIPANT",
  },
  {
    id: "we-9",
    leaderId: "w-leader-2",
    date: "2026-05-29",
    time: "15:30",
    content: "Họp Ban Thường vụ Đảng ủy (P405-S1)",
    type: "ORIGINAL",
  },
  {
    id: "we-10",
    leaderId: "w-leader-4",
    date: "2026-05-30",
    time: "07:00",
    content: "Trực BGĐ",
    type: "DUTY",
  },
  {
    id: "we-11",
    leaderId: "w-leader-3",
    date: "2026-05-30",
    time: "10:00",
    content: "Tổng kết tuần công tác đào tạo (P715-S4)",
    type: "ORIGINAL",
  },
  {
    id: "we-12",
    leaderId: "w-leader-2",
    date: "2026-05-31",
    time: "08:00",
    content: "Dự lễ phát động thi đua (Sân Học viện)",
    type: "PARTICIPANT",
  },
]

export function getWeekScheduleEntryTypeMeta(type: WeekScheduleEntry["type"]) {
  return WEEK_SCHEDULE_ENTRY_TYPES.find((item) => item.type === type) ?? WEEK_SCHEDULE_ENTRY_TYPES[0]
}
