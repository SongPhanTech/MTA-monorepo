import type { FixedClassType, StudentStatus, StudentTrainingType } from "@workspace/db/client"

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
  soDienThoai: string
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

export type DiemRenLuyenRow = {
  id: string
  maSinhVien: string
  hoVaTen: string
  diem: number | null
  xepLoai: StudentTrainingType | null
  ghiChu: string
}

export type ThongKeDiemRenLuyen = {
  tongSinhVien: number
  soSinhVienCoDiem: number
  diemTrungBinh: number | null
  diemCaoNhat: number | null
  diemThapNhat: number | null
}

export type TongKetRow = {
  id: string
  maSinhVien: string
  hoVaTen: string
  diemToiDa: number
  diem: number | null
  xepLoai: string | null
  ghiChu: string
}

export type ThongKeXepLoaiItem = {
  ten: string
  rankOrder: number
  soSinhVien: number
  tyLe: string
}

export type ThongKeTongKet = {
  tongSinhVien: number
  diemTrungBinh: number | null
  heDiem: 4 | 10
  theoXepLoai: ThongKeXepLoaiItem[]
}
