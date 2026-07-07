export type TomTatSinhVien = {
  anhDaiDien?: string
  hoVaTen: string
  trangThai: { label: string; color: string }
  maSinhVien: string
  ngaySinh: string
  gioiTinh: string
  lop: string
  khoa: string
  donViQuanLy: string
  heDaoTao: string
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
  gpa: string
  xepLoaiHocLuc: string | null
  diemRenLuyen: string | null
}

export type ChungChiDaDuyet = {
  id: string
  certificateId: string
  tenChungChi: string
  trinhDoYeuCau: string
  ketQua: string
  ngayCap: string
  donViCap: string
}

export type ChiTietMonHocDieuKien = {
  tenMon: string
  ketQua: string
  diem?: string
  namHoc: string
  ghiChu?: string
}

export type DieuKienTotNghiepItem = {
  dat: boolean
  trinhDoYeuCau?: string
  chungChi?: ChungChiDaDuyet | null
  chiTietMonHoc?: ChiTietMonHocDieuKien | null
}

export type DieuKienTotNghiep = {
  ngoaiNgu: DieuKienTotNghiepItem
  tinHoc: DieuKienTotNghiepItem
  giaoDucQuocPhong: DieuKienTotNghiepItem
  renLuyenSucKhoe: DieuKienTotNghiepItem
  duDieuKienDayDu: boolean
}

export type HocBongSinhVien = {
  id: string
  namHoc: string
  hocKy: string
  loaiHocBong: string
  gpaTaiThoiDiem: string
  giaTri: string
  trangThai: { label: string; color: string }
  ngayQuyetDinh: string
}

export type SuKienCanhBaoKyLuat = {
  id: string
  ngay: string
  tieuDe: string
  lyDo: string
  trangThai: { label: string; color: string }
}

export type TinhTrangHocTapSinhVien = {
  hocBong: HocBongSinhVien[]
  lichSuCanhBaoKyLuat: SuKienCanhBaoKyLuat[]
  capNhatCuoi?: string
}

export type GiaiThuongSinhVien = {
  id: string
  ngay: string
  namHoc: string
  tenGiaiThuong: string
  thanhTich: string
  donViTrao: string
  soQuyetDinh: string
  diemThuong: number
  trangThai: { label: string; color: string }
  moTa: string
}

export type QuyetDinhTotNghiepSinhVien = {
  id: string
  namHoc: string
  hocKy: string
  soQuyetDinh: string
  loaiQuyetDinh: string
  noiDung: string
  nguoiKy: string
  ngayKy: string
  ghiChu: string
}

export type HoSoSinhVien = {
  tomTat: TomTatSinhVien
  caNhan: ThongTinCaNhanSinhVien
  hocTap: ThongTinHocTapSinhVien
  quaTrinh: SuKienQuaTrinh[]
  dieuKienTotNghiep: DieuKienTotNghiep
  lienHe: ThongTinLienHeSinhVien
  khac: ThongTinKhacSinhVien
  lichSuHocTap: LichSuHocTapSinhVien
  tinhTrangHocTap: TinhTrangHocTapSinhVien
  giaiThuong: GiaiThuongSinhVien[]
  quyetDinhTotNghiep: QuyetDinhTotNghiepSinhVien[]
}
