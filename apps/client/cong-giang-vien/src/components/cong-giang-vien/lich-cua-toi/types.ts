/** Tab chính trên trang Lịch của tôi. */
export type TabLichCuaToi = "tat-ca" | "giang-day" | "ca-nhan"

/** Chế độ hiển thị thời gian (sẽ dùng ở từng tab). */
export type CheDoHienThiLich = "ngay" | "tuan" | "thang"

/** Dạng UI lịch (sẽ dùng ở từng tab). */
export type DangXemLich = "bang" | "lich"

export const TAB_LICH_CUA_TOI: { key: TabLichCuaToi; label: string }[] = [
  { key: "tat-ca", label: "Tất cả lịch" },
  { key: "giang-day", label: "Lịch giảng dạy" },
  { key: "ca-nhan", label: "Lịch cá nhân" },
]
