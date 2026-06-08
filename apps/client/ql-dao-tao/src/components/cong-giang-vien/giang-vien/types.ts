// Kiểu dữ liệu dùng chung cho trang chủ Cổng giảng viên.

import type { PeriodType } from "@workspace/db"

export type CheDoLich = "ngay" | "tuan"

export type TrangThaiLop = "dang_hoc" | "sap_dien_ra" | "da_ket_thuc" | "tot_nghiep"

export const TRANG_THAI_LOP_META: Record<TrangThaiLop, { label: string; color: string }> = {
  dang_hoc: { label: "Đang học", color: "green" },
  sap_dien_ra: { label: "Sắp diễn ra", color: "orange" },
  da_ket_thuc: { label: "Đã kết thúc", color: "default" },
  tot_nghiep: { label: "Đã tốt nghiệp", color: "blue" },
}

/** Dòng dữ liệu cho bảng Lớp giảng dạy / Lớp trợ giảng. */
export interface LopMonHocRow {
  id: string
  maLop: string
  monHoc: string
  siSo: number
  trangThai: TrangThaiLop
}

/** Dòng dữ liệu cho bảng Lớp quản lý. */
export interface LopQuanLyRow {
  id: string
  maLop: string
  tenLop: string
  siSo: number
  trangThai: TrangThaiLop
}

/** Thống kê nhanh hiển thị trên các thẻ đầu trang. */
export interface ThongKeTrangChu {
  soLopGiangDay: number
  soLopQuanLy: number
  soLopTroGiang: number
  tongKhaoSat: number
  khaoSatDangDienRa: number
  khaoSatSapDienRa: number
}

/** Sự kiện lịch dùng cho view Ngày / Tuần. */
export interface SuKienLich {
  id: string
  ngay: string
  tieuDe: string
  tiet: string
  thoiGian: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
  loaiLich: PeriodType
  diaDiem: string
  ghiChu?: string
}

export const LOAI_LICH_META: Record<
  PeriodType,
  { label: string; badgeColor: string; blockBg: string; blockBorder: string }
> = {
  THEORY: {
    label: "Giảng dạy",
    badgeColor: "blue",
    blockBg: "bg-blue-50",
    blockBorder: "border-l-blue-500",
  },
  CHECK: {
    label: "Kiểm tra",
    badgeColor: "green",
    blockBg: "bg-green-50",
    blockBorder: "border-l-green-500",
  },
  WEEK: {
    label: "Tuần học viện",
    badgeColor: "orange",
    blockBg: "bg-orange-50",
    blockBorder: "border-l-orange-500",
  },
  EXAM: {
    label: "Thi",
    badgeColor: "red",
    blockBg: "bg-red-50",
    blockBorder: "border-l-red-500",
  },
  PRACTICE: {
    label: "Thực hành",
    badgeColor: "gold",
    blockBg: "bg-amber-50",
    blockBorder: "border-l-amber-500",
  },
  LAB: {
    label: "Thí nghiệm",
    badgeColor: "purple",
    blockBg: "bg-purple-50",
    blockBorder: "border-l-purple-500",
  },
  SEMINAR: {
    label: "Seminar",
    badgeColor: "cyan",
    blockBg: "bg-cyan-50",
    blockBorder: "border-l-cyan-500",
  },
  MAKEUP: {
    label: "Học bù",
    badgeColor: "default",
    blockBg: "bg-gray-50",
    blockBorder: "border-l-gray-400",
  },
  REVIEW: {
    label: "Ôn tập",
    badgeColor: "orange",
    blockBg: "bg-orange-50",
    blockBorder: "border-l-orange-500",
  },
}

/** Thông tin cá nhân tóm tắt trên thẻ THÔNG TIN CÁ NHÂN. */
export interface ThongTinCaNhanTomTat {
  hoVaTen: string
  maGiangVien: string
  khoa: string
  boMon: string
  hocVi: string
  email: string
  dienThoai: string
  anhDaiDien?: string
}
