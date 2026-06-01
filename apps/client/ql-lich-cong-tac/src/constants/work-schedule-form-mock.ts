import type {
  WorkScheduleEventType,
  WorkScheduleEventTypeMeta,
  WorkScheduleFormValues,
  WorkScheduleHostUnit,
  WorkScheduleParticipant,
  WorkScheduleParticipantRole,
  WorkSchedulePreviewEvent,
} from "@/types/work-schedule-form"

export const WORK_SCHEDULE_EVENT_TYPES: WorkScheduleEventTypeMeta[] = [
  { value: "HOP", label: "Họp", color: "#13ab55", background: "#e8f7ef" },
  { value: "LAM_VIEC", label: "Làm việc", color: "#1677ff", background: "#e6f4ff" },
  { value: "TIEP_KHACH", label: "Tiếp khách", color: "#722ed1", background: "#f9f0ff" },
  { value: "CONG_TAC", label: "Công tác", color: "#fa8c16", background: "#fff7e6" },
  { value: "KHAC", label: "Khác", color: "#595959", background: "#f5f5f5" },
]

export const WORK_SCHEDULE_HOST_UNITS: WorkScheduleHostUnit[] = [
  { id: "unit-1", name: "Vụ Tổ chức cán bộ" },
  { id: "unit-2", name: "Vụ Kế hoạch - Tài chính" },
  { id: "unit-3", name: "Văn phòng Bộ" },
  { id: "unit-4", name: "Ban Giám đốc Học viện" },
  { id: "unit-5", name: "Phòng Đào tạo" },
]

export const WORK_SCHEDULE_PARTICIPANT_ROLES: WorkScheduleParticipantRole[] = [
  { id: "role-1", name: "Thành viên" },
  { id: "role-2", name: "Chủ trì" },
  { id: "role-3", name: "Thư ký" },
  { id: "role-4", name: "Đại diện" },
]

export const WORK_SCHEDULE_PARTICIPANTS: WorkScheduleParticipant[] = [
  { id: "p-1", fullName: "Ông Trần Văn B", department: "Vụ Tổ chức cán bộ" },
  { id: "p-2", fullName: "Bà Lê Thị C", department: "Văn phòng Bộ" },
  { id: "p-3", fullName: "Ông Phạm Văn D", department: "Vụ Kế hoạch - Tài chính" },
  { id: "p-4", fullName: "Ông Hoàng Văn E", department: "Vụ Kế hoạch - Tài chính" },
  { id: "p-5", fullName: "Bà Nguyễn Thị F", department: "Văn phòng Bộ" },
  { id: "p-6", fullName: "Ông Lê Văn G", department: "Ban Giám đốc Học viện" },
  { id: "p-7", fullName: "Bà Phạm Thị H", department: "Phòng Đào tạo" },
  { id: "p-8", fullName: "Ông Vũ Văn I", department: "Vụ Tổ chức cán bộ" },
  { id: "p-9", fullName: "Bà Đặng Thị K", department: "Văn phòng Bộ" },
  { id: "p-10", fullName: "Ông Bùi Văn L", department: "Vụ Kế hoạch - Tài chính" },
  { id: "p-11", fullName: "Bà Trần Thị M", department: "Phòng Đào tạo" },
  { id: "p-12", fullName: "Ông Ngô Văn N", department: "Ban Giám đốc Học viện" },
  { id: "p-13", fullName: "Bà Hoàng Thị O", department: "Vụ Tổ chức cán bộ" },
  { id: "p-14", fullName: "Ông Đinh Văn P", department: "Văn phòng Bộ" },
  { id: "p-15", fullName: "Bà Mai Thị Q", department: "Phòng Đào tạo" },
]

export const MOCK_PREVIEW_DATE = "2026-05-25"

export const MOCK_PREVIEW_EVENTS: WorkSchedulePreviewEvent[] = [
  {
    id: "preview-1",
    date: MOCK_PREVIEW_DATE,
    startTime: "07:30",
    endTime: "09:00",
    type: "HOP",
    title: "Họp giao ban Ban Lãnh đạo Bộ",
    location: "Phòng họp A - Tầng 4, Nhà điều hành",
    participantCount: 3,
    leaderId: "leader-3",
  },
  {
    id: "preview-2",
    date: MOCK_PREVIEW_DATE,
    startTime: "10:00",
    endTime: "11:30",
    type: "LAM_VIEC",
    title: "Làm việc với Cục Hợp tác quốc tế",
    location: "Phòng họp B - Tầng 5, Nhà điều hành",
    participantCount: 8,
    leaderId: "leader-3",
  },
  {
    id: "preview-3",
    date: MOCK_PREVIEW_DATE,
    startTime: "13:30",
    endTime: "15:00",
    type: "HOP",
    title: "Họp về dự thảo Thông tư",
    location: "Phòng họp C - Tầng 3, Nhà điều hành",
    participantCount: 12,
    leaderId: "leader-3",
  },
  {
    id: "preview-4",
    date: MOCK_PREVIEW_DATE,
    startTime: "15:00",
    endTime: "16:30",
    type: "TIEP_KHACH",
    title: "Tiếp xã giao đoàn nước ngoài",
    location: "Phòng khách VIP - Tầng 2, Nhà điều hành",
    participantCount: 6,
    leaderId: "leader-3",
  },
]

export const DEFAULT_WORK_SCHEDULE_FORM_VALUES: WorkScheduleFormValues = {
  leaderId: "leader-3",
  eventType: "HOP",
  date: MOCK_PREVIEW_DATE,
  startTime: "07:30",
  endTime: "09:00",
  content: "Họp giao ban Ban Lãnh đạo Bộ",
  location: "Phòng họp A - Tầng 4, Nhà điều hành",
  hostUnitId: "unit-1",
  participantIds: ["p-1", "p-2", "p-3"],
  participantRoleId: "role-1",
}

export function getEventTypeMeta(type: WorkScheduleEventType) {
  return (
    WORK_SCHEDULE_EVENT_TYPES.find((item) => item.value === type) ?? WORK_SCHEDULE_EVENT_TYPES[0]
  )
}
