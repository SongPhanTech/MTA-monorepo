/** Nhóm loại lịch hiển thị trên bảng / thẻ thống kê. */
export type NhomLoaiLichCaNhan = "cong-viec" | "cuoc-hop" | "ca-nhan" | "giang-day"

export type DongLichCaNhan = {
  id: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
  tiet: string
  tieuDe: string
  nhomLoai: NhomLoaiLichCaNhan
  tenLoai: string
  mauLoai?: string
  diaDiem: string
  noiDung: string
  ghiChu: string
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
