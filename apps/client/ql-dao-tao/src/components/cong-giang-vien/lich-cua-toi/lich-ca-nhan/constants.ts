import type { NhomLoaiLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"

/** Tag mặc định tạo tự động khi giảng viên chưa có loại lịch nào. */
export const TAG_LOAI_LICH_MAC_DINH = [
  { name: "Công việc", color: "#16a34a", sortOrder: 0 },
  { name: "Cuộc họp", color: "#ea580c", sortOrder: 1 },
  { name: "Cá nhân", color: "#9333ea", sortOrder: 2 },
] as const

export const META_LOAI_LICH_CA_NHAN: Record<
  NhomLoaiLichCaNhan,
  { label: string; tagClass: string }
> = {
  "giang-day": {
    label: "Giảng dạy",
    tagClass: "bg-green-50 text-green-700 border-green-200",
  },
  "cong-viec": {
    label: "Công việc",
    tagClass: "bg-green-50 text-green-700 border-green-200",
  },
  "cuoc-hop": {
    label: "Cuộc họp",
    tagClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  "ca-nhan": {
    label: "Cá nhân",
    tagClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
}
