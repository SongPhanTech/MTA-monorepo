import type { WorkScheduleLeader } from "@/types/work-schedule"

/** Tạm dùng mock — thay bằng CRUD AcademyLeader khi có schema DB */
export const WORK_SCHEDULE_LEADERS: WorkScheduleLeader[] = [
  {
    id: "leader-1",
    rankTitle: "Trung tướng",
    fullName: "Lê Minh Thái",
    sortOrder: 1,
    active: true,
    showOnDisplay: true,
  },
  {
    id: "leader-2",
    rankTitle: "Trung tướng",
    fullName: "Trần Văn Thưởng",
    sortOrder: 2,
    active: true,
    showOnDisplay: true,
  },
  {
    id: "leader-3",
    rankTitle: "Thứ trưởng",
    fullName: "Nguyễn Văn A",
    sortOrder: 3,
    active: true,
    showOnDisplay: true,
  },
  {
    id: "leader-4",
    rankTitle: "Thiếu tướng",
    fullName: "Phạm Văn B",
    sortOrder: 4,
    active: true,
    showOnDisplay: false,
  },
]
