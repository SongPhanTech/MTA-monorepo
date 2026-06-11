import type { DongLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import type { DongLichGiangDay } from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/types"
import {
  layMaHienThiLichGiangDay,
  MAU_SU_KIEN_LICH_GIANG_DAY,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import type {
  DongBangTatCaLich,
  DongBangThangTatCaLich,
  DongTatCaLich,
  ThongKeTatCaLich,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import {
  formatNgayBang,
  formatThu,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import dayjs, { type Dayjs } from "dayjs"

const TEN_LOAI_GIANG_DAY = "Giảng dạy"

export { TEN_LOAI_GIANG_DAY }

const hienThiDiaDiem = (value: string) => (value && value !== "—" ? value : "—")

const hienThiGhiChu = (value: string) => (value && value !== "—" ? value : "—")

export const mapGiangDaySangTatCa = (lich: DongLichGiangDay): DongTatCaLich => {
  const ma = layMaHienThiLichGiangDay(lich)
  const diaDiem =
    lich.phongHoc !== "—"
      ? lich.phongHoc
      : lich.khuVuc !== "—"
        ? lich.khuVuc
        : "—"

  return {
    id: `gd-${lich.id}`,
    idGoc: lich.id,
    nguon: "giang-day",
    ngayKey: lich.ngayKey,
    thoiGian: `${lich.thoiGianBatDau} - ${lich.thoiGianKetThuc}`,
    batDauIso: lich.batDauIso,
    ketThucIso: lich.ketThucIso,
    caNgay: false,
    tieuDeHienThi: lich.hocPhan,
    noiDung: `Tiết ${lich.tiet}: ${ma}`,
    tenLoai: TEN_LOAI_GIANG_DAY,
    mauLoai: MAU_SU_KIEN_LICH_GIANG_DAY,
    diaDiem: hienThiDiaDiem(diaDiem),
    ghiChu: hienThiGhiChu(lich.ghiChu),
  }
}

export const mapCaNhanSangTatCa = (lich: DongLichCaNhan): DongTatCaLich => ({
  id: `cn-${lich.id}`,
  idGoc: lich.id,
  nguon: "ca-nhan",
  ngayKey: lich.ngayKey,
  thoiGian: lich.caNgay ? "Cả ngày" : `${lich.thoiGianBatDau} - ${lich.thoiGianKetThuc}`,
  batDauIso: lich.batDauIso,
  ketThucIso: lich.ketThucIso,
  caNgay: lich.caNgay,
  tieuDeHienThi: lich.tieuDe,
  noiDung: lich.tieuDe,
  tenLoai: lich.tenLoai && lich.tenLoai !== "—" ? lich.tenLoai : "Cá nhân",
  mauLoai: lich.mauLoai ?? MAU_LOAI_MAC_DINH,
  diaDiem: hienThiDiaDiem(lich.diaDiem),
  ghiChu: hienThiGhiChu(lich.noiDung !== "—" ? lich.noiDung : "—"),
})

export const gopVaSapXepLich = (
  giangDay: DongLichGiangDay[],
  caNhan: DongLichCaNhan[]
): DongTatCaLich[] => {
  const merged = [
    ...giangDay.map(mapGiangDaySangTatCa),
    ...caNhan.map(mapCaNhanSangTatCa),
  ]
  return merged.sort((a, b) => a.batDauIso.localeCompare(b.batDauIso))
}

export const tinhThongKeTatCaLich = (danhSach: DongTatCaLich[]): ThongKeTatCaLich => ({
  tongLich: danhSach.length,
  lichGiangDay: danhSach.filter((item) => item.nguon === "giang-day").length,
  lichCaNhan: danhSach.filter((item) => item.nguon === "ca-nhan").length,
})

export const locSuKienTrongThang = (danhSach: DongTatCaLich[], thangXem: Dayjs) =>
  danhSach.filter((item) => dayjs(item.ngayKey).isSame(thangXem, "month"))

export const locLichTheoTuKhoa = (danhSach: DongTatCaLich[], tuKhoa: string) => {
  const q = tuKhoa.trim().toLowerCase()
  if (!q) return danhSach
  return danhSach.filter(
    (item) =>
      item.noiDung.toLowerCase().includes(q) ||
      item.tieuDeHienThi.toLowerCase().includes(q) ||
      item.tenLoai.toLowerCase().includes(q) ||
      item.diaDiem.toLowerCase().includes(q) ||
      item.ghiChu.toLowerCase().includes(q)
  )
}

export const chuyenSangDongBangTuan = (danhSach: DongTatCaLich[]): DongBangTatCaLich[] => {
  const rows: DongBangTatCaLich[] = []
  let i = 0

  while (i < danhSach.length) {
    const ngayKey = danhSach[i].ngayKey
    const suKienNgay: DongTatCaLich[] = []

    while (i < danhSach.length && danhSach[i].ngayKey === ngayKey) {
      suKienNgay.push(danhSach[i])
      i++
    }

    const count = suKienNgay.length
    suKienNgay.forEach((suKien, idx) => {
      rows.push({
        ...suKien,
        thu: formatThu(suKien.ngayKey),
        ngay: dayjs(suKien.ngayKey).format("DD/MM"),
        rowSpanThu: idx === 0 ? count : 0,
        rowSpanNgay: idx === 0 ? count : 0,
      })
    })
  }

  return rows
}

export const chuyenSangDongBangThang = (danhSach: DongTatCaLich[]): DongBangThangTatCaLich[] => {
  const rows: DongBangThangTatCaLich[] = []
  let i = 0

  while (i < danhSach.length) {
    const ngayKey = danhSach[i].ngayKey
    const suKienNgay: DongTatCaLich[] = []

    while (i < danhSach.length && danhSach[i].ngayKey === ngayKey) {
      suKienNgay.push(danhSach[i])
      i++
    }

    const count = suKienNgay.length
    suKienNgay.forEach((suKien, idx) => {
      rows.push({
        ...suKien,
        thu: formatThu(suKien.ngayKey),
        ngay: formatNgayBang(suKien.ngayKey),
        rowSpanThu: idx === 0 ? count : 0,
        rowSpanNgay: idx === 0 ? count : 0,
      })
    })
  }

  return rows
}
