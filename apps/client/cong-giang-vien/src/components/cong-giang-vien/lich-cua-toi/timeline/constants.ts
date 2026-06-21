import dayjs from "dayjs"

export const GIO_BAT_DAU = 0
export const GIO_KET_THUC = 24
export const CHIEU_CAO_MOI_GIO = 56
export const CHIEU_CAO_TIMELINE = GIO_KET_THUC * CHIEU_CAO_MOI_GIO

export const gioTrongTimeline = () =>
  Array.from({ length: GIO_KET_THUC - GIO_BAT_DAU + 1 }, (_, i) => GIO_BAT_DAU + i)

export const formatGioTimeline = (gio: number) => `${String(gio).padStart(2, "0")}:00`

export const tinhViTriTimeline = (
  batDauIso: string,
  ketThucIso: string,
  caNgay = false,
  chieuCaoToiThieu = 40
) => {
  if (caNgay) {
    return { topPx: 0, heightPx: CHIEU_CAO_TIMELINE }
  }

  const batDau = dayjs(batDauIso)
  const ketThuc = dayjs(ketThucIso)
  const phutBatDau = batDau.hour() * 60 + batDau.minute()
  const phutKetThuc = ketThuc.hour() * 60 + ketThuc.minute()

  return {
    topPx: (phutBatDau / 60) * CHIEU_CAO_MOI_GIO,
    heightPx: Math.max(chieuCaoToiThieu, ((phutKetThuc - phutBatDau) / 60) * CHIEU_CAO_MOI_GIO),
  }
}
