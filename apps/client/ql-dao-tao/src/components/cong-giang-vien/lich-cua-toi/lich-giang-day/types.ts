import type { PeriodType } from "@workspace/db"

export type DongLichGiangDay = {
  id: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
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

export type ThongKeLichGiangDay = {
  tongTiet: number
  soLopHocPhan: number
  soPhongHoc: number
}
