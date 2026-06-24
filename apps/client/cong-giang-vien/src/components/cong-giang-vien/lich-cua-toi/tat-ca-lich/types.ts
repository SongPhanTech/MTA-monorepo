export type NguonLichTatCa = "giang-day" | "ca-nhan"

export type LichChiTietTatCa =
  | { nguon: "giang-day"; id: string }
  | { nguon: "ca-nhan"; id: string }

export type DongTatCaLich = {
  id: string
  idGoc: string
  nguon: NguonLichTatCa
  ngayKey: string
  thoiGian: string
  batDauIso: string
  ketThucIso: string
  caNgay: boolean
  /** Tiêu đề hiển thị trên lịch (timeline). */
  tieuDeHienThi: string
  /** Nội dung hiển thị trên bảng. */
  noiDung: string
  tenLoai: string
  mauLoai: string
  diaDiem: string
  ghiChu: string
}

export type ThongKeTatCaLich = {
  tongLich: number
  lichGiangDay: number
  lichCaNhan: number
}

export type DongBangTatCaLich = DongTatCaLich & {
  thu: string
  ngay: string
  rowSpanThu: number
  rowSpanNgay: number
}

export type DongBangThangTatCaLich = DongTatCaLich & {
  thu: string
  ngay: string
  rowSpanThu: number
  rowSpanNgay: number
}
