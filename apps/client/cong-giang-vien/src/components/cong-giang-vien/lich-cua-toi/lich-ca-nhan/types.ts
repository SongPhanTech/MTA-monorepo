/** Nhóm loại lịch hiển thị trên bảng / thẻ thống kê. */
export type NhomLoaiLichCaNhan = "cong-viec" | "cuoc-hop" | "ca-nhan" | "giang-day"

export type TagLoaiLich = {
  id: string
  name: string
  color: string | null
}

export type DongLichCaNhan = {
  id: string
  ngayKey: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
  caNgay: boolean
  batDauIso: string
  ketThucIso: string
  tieuDe: string
  nhomLoai: NhomLoaiLichCaNhan
  tenLoai: string
  mauLoai?: string
  diaDiem: string
  noiDung: string
  ghiChu: string
  daHoanThanh: boolean
}

export type NhomNgayLich = {
  id: string
  key: string
  nhanNgay: string
  suKien: DongLichCaNhan[]
}

export type DongLichBangThang = DongLichCaNhan & {
  thu: string
  ngay: string
  rowSpanThu: number
  rowSpanNgay: number
}

export type ThongKeLichCaNhan = {
  tongSuKien: number
  tongBienDong: string
  congViec: number
  congViecBienDong: string
  cuocHop: number
  cuocHopBienDong: string
  caNhan: number
  caNhanBienDong: string
}
