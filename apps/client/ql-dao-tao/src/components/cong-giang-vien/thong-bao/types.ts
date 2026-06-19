import {
  nhapDiemQuaTrinhGiangDayPath,
  nhapDiemThiGiangDayPath,
} from "@constants/cong-giang-vien-path"
import type { LucideIcon } from "lucide-react"
import { ClipboardList, Clock, FileText, Users } from "lucide-react"

/** 4 loại thông báo dùng tại cổng giảng viên. */
export type LoaiThongBaoGv =
  | "TEACHING_ASSIGNMENTS"
  | "PROCESS_SCORE_DEADLINE"
  | "EXAM_DEADLINE"
  | "SURVEY_DEADLINE"

export const DANH_SACH_LOAI_THONG_BAO_GV: LoaiThongBaoGv[] = [
  "TEACHING_ASSIGNMENTS",
  "PROCESS_SCORE_DEADLINE",
  "EXAM_DEADLINE",
  "SURVEY_DEADLINE",
]

export type MucCanhBao = "moi" | "sap_het_han" | "qua_han"

export type BoLocMucCanhBao = MucCanhBao | "tat_ca"

export type TrangThaiDoc = "tat_ca" | "chua_doc" | "da_doc"

export interface BoLocThongBao {
  tuKhoa: string
  loai: LoaiThongBaoGv | "tat_ca"
  mucCanhBao: BoLocMucCanhBao
  trangThaiDoc: TrangThaiDoc
}

export interface ThongBaoView {
  id: string
  tieuDe: string
  tomTat: string
  loai: LoaiThongBaoGv
  mucCanhBao: MucCanhBao
  thoiGian: string
  hanXuLy?: string
  daDoc: boolean
  /** Id lớp môn học liên quan (trích từ `code` thông báo) để mở đúng trang nhập điểm. */
  subjectClassId?: string
}

export interface LoaiThongBaoMeta {
  label: string
  tagLabel: string
  iconBg: string
  iconColor: string
  tagBg: string
  tagColor: string
  Icon: LucideIcon
}

export interface MucCanhBaoMeta {
  label: string
  tagLabel: string
  accent: string
  cardBg: string
  dot: string
  statusColor: string
  tagBg: string
  tagColor: string
}

export const LOAI_THONG_BAO_META: Record<LoaiThongBaoGv, LoaiThongBaoMeta> = {
  TEACHING_ASSIGNMENTS: {
    label: "Phân công giảng dạy",
    tagLabel: "Phân công giảng dạy",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    tagBg: "bg-blue-50",
    tagColor: "text-blue-700",
    Icon: Users,
  },
  PROCESS_SCORE_DEADLINE: {
    label: "Hạn nhập điểm quá trình",
    tagLabel: "Nhập điểm quá trình",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    tagBg: "bg-amber-50",
    tagColor: "text-amber-800",
    Icon: Clock,
  },
  EXAM_DEADLINE: {
    label: "Hạn nhập điểm thi",
    tagLabel: "Nhập điểm thi",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    tagBg: "bg-emerald-50",
    tagColor: "text-emerald-800",
    Icon: FileText,
  },
  SURVEY_DEADLINE: {
    label: "Hạn điền khảo sát",
    tagLabel: "Khảo sát",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    tagBg: "bg-violet-50",
    tagColor: "text-violet-800",
    Icon: ClipboardList,
  },
}

/** Màu theo mức cảnh báo — thanh accent, trạng thái, tag mức độ. */
export const MUC_CANH_BAO_META: Record<MucCanhBao, MucCanhBaoMeta> = {
  moi: {
    label: "Thông báo mới",
    tagLabel: "Mới",
    accent: "bg-blue-500",
    cardBg: "bg-blue-50/30",
    dot: "bg-blue-500",
    statusColor: "text-blue-600",
    tagBg: "bg-blue-100",
    tagColor: "text-blue-800",
  },
  sap_het_han: {
    label: "Sắp hết hạn",
    tagLabel: "Sắp hết hạn",
    accent: "bg-orange-500",
    cardBg: "bg-orange-50/40",
    dot: "bg-orange-500",
    statusColor: "text-orange-600",
    tagBg: "bg-orange-100",
    tagColor: "text-orange-800",
  },
  qua_han: {
    label: "Đã quá hạn",
    tagLabel: "Quá hạn",
    accent: "bg-red-500",
    cardBg: "bg-red-50/40",
    dot: "bg-red-500",
    statusColor: "text-red-600",
    tagBg: "bg-red-100",
    tagColor: "text-red-800",
  },
}

export const TUY_CHON_LOAI_THONG_BAO = DANH_SACH_LOAI_THONG_BAO_GV.map((value) => ({
  value,
  label: LOAI_THONG_BAO_META[value].label,
}))

export const TUY_CHON_MUC_CANH_BAO: { value: BoLocMucCanhBao; label: string }[] = [
  { value: "tat_ca", label: "Tất cả mức độ" },
  { value: "moi", label: MUC_CANH_BAO_META.moi.label },
  { value: "sap_het_han", label: MUC_CANH_BAO_META.sap_het_han.label },
  { value: "qua_han", label: MUC_CANH_BAO_META.qua_han.label },
]

export const TUY_CHON_TRANG_THAI_DOC: { value: TrangThaiDoc; label: string }[] = [
  { value: "tat_ca", label: "Tất cả" },
  { value: "chua_doc", label: "Chưa đọc" },
  { value: "da_doc", label: "Đã đọc" },
]

/** Số ngày trước hạn được coi là "sắp hết hạn". */
export const SO_NGAY_SAP_HET_HAN = 3

/** Thứ tự ưu tiên sắp xếp: quá hạn → sắp hết hạn → mới. */
export const THU_TU_MUC_CANH_BAO: Record<MucCanhBao, number> = {
  qua_han: 0,
  sap_het_han: 1,
  moi: 2,
}

export const isLoaiThongBaoGv = (type: string): type is LoaiThongBaoGv =>
  DANH_SACH_LOAI_THONG_BAO_GV.includes(type as LoaiThongBaoGv)

/**
 * Trích id lớp môn học từ `code` thông báo deadline.
 * Định dạng code: `CRON-{type}-{subjectClassId}-{lecturerId}-{slotKey}`.
 * Id là cuid (không chứa dấu "-") nên phần tử thứ 3 luôn là subjectClassId.
 */
export const laySubjectClassIdTuMaThongBao = (code?: string | null): string | undefined => {
  if (!code?.startsWith("CRON-")) return undefined
  return code.split("-")[2] || undefined
}

/** Đường dẫn trang nhập điểm tương ứng với loại thông báo (chỉ áp dụng cho hạn nhập điểm). */
export const duongDanNhapDiemTheoThongBao = (thongBao: ThongBaoView): string | undefined => {
  if (thongBao.loai === "PROCESS_SCORE_DEADLINE") {
    return nhapDiemQuaTrinhGiangDayPath(thongBao.subjectClassId)
  }
  if (thongBao.loai === "EXAM_DEADLINE") {
    return nhapDiemThiGiangDayPath(thongBao.subjectClassId)
  }
  return undefined
}
