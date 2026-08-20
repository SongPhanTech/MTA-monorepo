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
  diemRecordId?: string | null
  xepLoai: StudentTrainingType | null
  ghiChu: string
}

export type DiemRenLuyenForm = {
  list: Record<string, { score: number | null }>
}

export type ThongKeDiemRenLuyen = {
  tongSinhVien: number
  soSinhVienCoDiem: number
  diemTrungBinh: number | null
  diemCaoNhat: number | null
  diemThapNhat: number | null
}

export type LocDiemRenLuyen = "cao_nhat" | "thap_nhat" | null

export type LocXepLoaiTongKet = string | null

export type TongKetRow = {
  id: string
  maSinhVien: string
  hoVaTen: string
  ngaySinh: string | null
  maLop: string
  tenLop: string
  namHocThu: number | null
  hocKyThu: number | null
  heSoXetHocBong: string | null
  trungBinhHe4: number | null
  tichLuyHe4: number | null
  trungBinhHe10: number | null
  tichLuyHe10: number | null
  xepLoai: string | null
  diemRenLuyen: number | null
  diem: number | null
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
