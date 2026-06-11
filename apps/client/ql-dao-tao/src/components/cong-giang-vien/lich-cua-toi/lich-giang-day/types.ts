import type { PeriodType } from "@workspace/db"

export type DongLichGiangDay = {
  id: string
  ngayKey: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
  tiet: string
  batDauIso: string
  ketThucIso: string
  hocPhan: string
  lopHocPhan: string
  khuVuc: string
  phongHoc: string
  ghiChu: string
  soTiet: number
  periodType: PeriodType
  subjectClassId: string | null
  phongKey: string
}

export type DongLichBangTheoNgayGiangDay = DongLichGiangDay & {
  thu: string
  ngay: string
  rowSpanThu: number
  rowSpanNgay: number
}

/** @deprecated Dùng DongLichBangTheoNgayGiangDay */
export type DongLichBangTuanGiangDay = DongLichBangTheoNgayGiangDay

export type ThongKeLichGiangDay = {
  tongTiet: number
  soLopHocPhan: number
  soPhongHoc: number
}
