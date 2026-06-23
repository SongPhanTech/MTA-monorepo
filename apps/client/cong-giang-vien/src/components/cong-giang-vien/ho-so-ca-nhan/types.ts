// Kiểu dữ liệu cho màn Hồ sơ cá nhân (Thông tin cá nhân) của giảng viên.
// Hiện đang dùng dữ liệu fake, sau này thay nguồn dữ liệu thật vẫn giữ nguyên các interface này.

export interface ThongTinCaNhan {
  hoVaTen: string
  gioiTinh: string
  ngaySinh: string
  email: string
  soDienThoai: string
  cmndCccd: string
  maGiangVien: string
  donViCongTac: string
  khoa: string
  boMon: string
  chucVu: string
  chucDanh: string
  hocHam: string
  ngayVaoTruong: string
  tinhTrang: string
  anhDaiDien?: string
}

export interface ThongKeHoSo {
  soNamCongTac: string
  soMonHocPhuTrach: number
  soLopGiangDay: number
  soSinhVienHuongDan: number
}

export interface ThongTinLienHe {
  diaChiLienHe: string
  diaChiThuongTru: string
  emailCaNhan: string
  dienThoaiDiDong: string
  dienThoaiCoQuan: string
}

export interface TrinhDoDaoTao {
  trinhDo: string
  namCapBang: string
  chuyenNganh: string
  noiDaoTao: string
  tenLuanAn: string
}

export interface QuaTrinhCongTac {
  id: string
  thoiGian: string
  donViCongTac: string
  viTriCongTac: string
  ghiChu?: string
}

export interface HoSoCaNhan {
  thongTin: ThongTinCaNhan
  thongKe: ThongKeHoSo
  lienHe: ThongTinLienHe
  daoTao: TrinhDoDaoTao
  quaTrinhCongTac: QuaTrinhCongTac[]
}
