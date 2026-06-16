// Kiểu dữ liệu + helper cho màn "Điểm danh" (cổng giảng viên / lớp trợ giảng).

/** Trạng thái điểm danh - khớp enum AttendanceStatus trong schema. */
export type TrangThaiDiemDanh = "PRESENT" | "EXCUSED_ABSENT" | "UNEXCUSED_ABSENT"

/** Một dòng sinh viên trong bảng điểm danh. */
export interface SinhVienDiemDanhRow {
  id: string // id của subjectClassStudent (hoặc studentId)
  studentId: string
  maSinhVien: string
  hoTen: string
  trangThai: TrangThaiDiemDanh
  ghiChu: string
}

/** Thông tin buổi học hiển thị ở panel phải. */
export interface ThongTinBuoiHoc {
  ngayHoc: string // dạng DD/MM/YYYY
  tietHoc: string // ví dụ "1 - 3"
  phongHoc: string
  siSo: number
}

/** Số liệu tổng kết điểm danh. */
export interface TongKetDiemDanh {
  tongSinhVien: number
  coMat: number
  vangCoPhep: number
  vangKhongPhep: number
  tyLeChuyenCan: number // %
  tyLeVang: number // %
}

/** Tính tổng kết từ danh sách sinh viên. */
export const tinhTongKet = (danhSach: SinhVienDiemDanhRow[]): TongKetDiemDanh => {
  const tongSinhVien = danhSach.length
  const coMat = danhSach.filter((sv) => sv.trangThai === "PRESENT").length
  const vangCoPhep = danhSach.filter((sv) => sv.trangThai === "EXCUSED_ABSENT").length
  const vangKhongPhep = danhSach.filter((sv) => sv.trangThai === "UNEXCUSED_ABSENT").length
  const phanTram = (so: number) =>
    tongSinhVien ? Math.round((so / tongSinhVien) * 10000) / 100 : 0

  return {
    tongSinhVien,
    coMat,
    vangCoPhep,
    vangKhongPhep,
    tyLeChuyenCan: phanTram(coMat),
    tyLeVang: phanTram(vangCoPhep + vangKhongPhep),
  }
}
