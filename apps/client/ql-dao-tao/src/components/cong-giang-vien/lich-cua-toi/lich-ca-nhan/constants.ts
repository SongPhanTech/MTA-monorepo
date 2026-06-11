/** Số loại lịch hiển thị trực tiếp trong modal; phần còn lại gom vào +N. */
export const SO_TAG_HIEN_THI_TOI_DA = 3

/** Bảng màu chọn khi thêm loại lịch mới. */
export const TUY_CHON_MAU_LOAI_LICH = [
  "#16a34a",
  "#2563eb",
  "#ea580c",
  "#9333ea",
  "#dc2626",
] as const

/** Tùy chọn nhắc lịch trong modal (value → reminderMinutes). */
export const TUY_CHON_NHAC_LICH = [
  { value: "none", label: "Không nhắc" },
  { value: "5", label: "Trước 5 phút" },
  { value: "15", label: "Trước 15 phút" },
  { value: "30", label: "Trước 30 phút" },
  { value: "60", label: "Trước 1 giờ" },
  { value: "1440", label: "Trước 1 ngày" },
] as const

/** Tùy chọn lặp lịch (value → ScheduleRepeatType). */
export const TUY_CHON_LAP_LAI = [
  { value: "NONE", label: "Không lặp lại" },
  { value: "DAILY", label: "Hàng ngày" },
  { value: "WEEKLY", label: "Hàng tuần" },
  { value: "MONTHLY", label: "Hàng tháng" },
  { value: "YEARLY", label: "Hàng năm" },
] as const
