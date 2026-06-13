import type { FixedClassType, StudentStatus } from "@workspace/db/client"

export type LoaiLopLoc = FixedClassType | "tat_ca"

export type BoLocLopQuanLy = {
  tuKhoa: string
  loaiLop: LoaiLopLoc
}

export type LopQuanLyChiTietRow = {
  id: string
  maLop: string
  tenLop: string
  donViQuanLy: string
  siSoNam: number
  siSoNu: number
  siSoTong: number
  hocKy: string
  namHoc: string
  classType: FixedClassType
  ghiChu: string
}

export type BoLocSinhVienLopQuanLy = {
  tuKhoa: string
  trangThai: StudentStatus | "tat_ca"
  gioiTinhId: string | "tat_ca"
}

export type SinhVienLopQuanLyRow = {
  id: string
  maSinhVien: string
  hoVaTen: string
  gioiTinh: string
  ngaySinh: string
  lienHe: string
  trangThai: StudentStatus
}

export type ThongTinLopQuanLyTomTat = {
  id: string
  maLop: string
  tenLop: string
  trangThaiLop: { label: string; color: string }
  siSo: number
  donViQuanLy: string
  chuyenNganh: string
  khoa: string
  bacDaoTao: string
  chuongTrinhDaoTao: string
  doiTuongDaoTao: string
}
