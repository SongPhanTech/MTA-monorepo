import dayjs from "dayjs"

export const GIO_BAT_DAU_LICH_NGAY = 0
export const GIO_KET_THUC_LICH_NGAY = 24
export const CHIEU_CAO_MOI_GIO_LICH_NGAY = 56

export const CHIEU_CAO_LICH_NGAY =
  (GIO_KET_THUC_LICH_NGAY - GIO_BAT_DAU_LICH_NGAY) * CHIEU_CAO_MOI_GIO_LICH_NGAY

export const gioTrongLichNgay = () =>
  Array.from(
    { length: GIO_KET_THUC_LICH_NGAY - GIO_BAT_DAU_LICH_NGAY + 1 },
    (_, i) => GIO_BAT_DAU_LICH_NGAY + i
  )

export const formatGioLichNgay = (gio: number) => `${String(gio).padStart(2, "0")}:00`

export const tinhViTriLichNgay = (
  batDauIso: string,
  ketThucIso: string,
  caNgay = false,
  chieuCaoToiThieu = 48
) => {
  if (caNgay) {
    return { topPx: 0, heightPx: CHIEU_CAO_LICH_NGAY }
  }

  const batDau = dayjs(batDauIso)
  const ketThuc = dayjs(ketThucIso)
  const phutBatDau = batDau.hour() * 60 + batDau.minute() - GIO_BAT_DAU_LICH_NGAY * 60
  const phutKetThuc = ketThuc.hour() * 60 + ketThuc.minute() - GIO_BAT_DAU_LICH_NGAY * 60

  return {
    topPx: Math.max(0, (phutBatDau / 60) * CHIEU_CAO_MOI_GIO_LICH_NGAY),
    heightPx: Math.max(
      chieuCaoToiThieu,
      ((phutKetThuc - phutBatDau) / 60) * CHIEU_CAO_MOI_GIO_LICH_NGAY
    ),
  }
}

export const GIO_BAT_DAU_LICH_TUAN = 0
export const GIO_KET_THUC_LICH_TUAN = 24
export const CHIEU_CAO_MOI_GIO_LICH_TUAN = CHIEU_CAO_MOI_GIO_LICH_NGAY

export const CHIEU_CAO_LICH_TUAN =
  (GIO_KET_THUC_LICH_TUAN - GIO_BAT_DAU_LICH_TUAN) * CHIEU_CAO_MOI_GIO_LICH_TUAN

export const gioTrongLichTuan = () =>
  Array.from(
    { length: GIO_KET_THUC_LICH_TUAN - GIO_BAT_DAU_LICH_TUAN + 1 },
    (_, i) => GIO_BAT_DAU_LICH_TUAN + i
  )

export const tinhViTriLichTuan = (
  batDauIso: string,
  ketThucIso: string,
  caNgay = false,
  chieuCaoToiThieu = 40
) => {
  if (caNgay) {
    return { topPx: 0, heightPx: CHIEU_CAO_LICH_TUAN }
  }

  const batDau = dayjs(batDauIso)
  const ketThuc = dayjs(ketThucIso)
  const phutBatDau = batDau.hour() * 60 + batDau.minute() - GIO_BAT_DAU_LICH_TUAN * 60
  const phutKetThuc = ketThuc.hour() * 60 + ketThuc.minute() - GIO_BAT_DAU_LICH_TUAN * 60

  return {
    topPx: Math.max(0, (phutBatDau / 60) * CHIEU_CAO_MOI_GIO_LICH_TUAN),
    heightPx: Math.max(
      chieuCaoToiThieu,
      ((phutKetThuc - phutBatDau) / 60) * CHIEU_CAO_MOI_GIO_LICH_TUAN
    ),
  }
}
