export type TomTatSinhVien = {
  anhDaiDien?: string
  hoVaTen: string
  trangThai: { label: string; color: string }
  maSinhVien: string
  lop: string
  khoa: string
  khoaVien: string
}

export type ThongTinCaNhanSinhVien = {
  hoVaTen: string
  ngaySinh: string
  gioiTinh: string
  cccd: string
  soDienThoai: string
  email: string
  queQuan: string
  danToc: string
  tonGiao: string
  doiTuongUuTien: string
}

export type ThongTinHocTapSinhVien = {
  heDaoTao: string
  chuongTrinhDaoTao: string
  ngayNhapHoc: string
  coVanHocTap: string
  hinhThuc: string
  thoiGianDaoTao: string
  trangThai: { label: string; color: string }
  nienKhoa: string
}

export type SuKienQuaTrinh = {
  id: string
  ngay: string
  loai: "khen-thuong" | "canh-bao" | "ky-luat"
  tieuDe: string
  moTa: string
}

export type ThongTinLienHeSinhVien = {
  thuongTru: string
  hienTai: string
  lienHeKhanCap: string
}

export type ThongTinKhacSinhVien = {
  ngayVaoDang: string
  ngayVaoDoan: string
  hocBong: string
  uuTien: string
}

export type LichSuHocTapSinhVien = {
  tongHocPhan: number
  tongTinChi: number
  cpa: string
  xepLoaiHocLuc: string | null
  xepLoaiRenLuyen: string | null
}

export type HoSoSinhVien = {
  tomTat: TomTatSinhVien
  caNhan: ThongTinCaNhanSinhVien
  hocTap: ThongTinHocTapSinhVien
  quaTrinh: SuKienQuaTrinh[]
  lienHe: ThongTinLienHeSinhVien
  khac: ThongTinKhacSinhVien
  lichSuHocTap: LichSuHocTapSinhVien
}
