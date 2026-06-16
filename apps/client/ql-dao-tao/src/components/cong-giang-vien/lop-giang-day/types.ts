import dayjs from "dayjs"
import type { SubjectClassType } from "@workspace/db/client"

export type TrangThaiNhapDiemLoc =
  | "tat_ca"
  | "chua_nhap"
  | "dang_nhap_qua_trinh"
  | "da_nhap_tx_dk"
  | "da_khoa"

export interface BoLocLopGiangDay {
  tuKhoa: string
  trangThaiNhapDiem: TrangThaiNhapDiemLoc
}

export interface LopGiangDayRow {
  id: string
  maLop: string
  tenMonHoc: string
  soTinChi: number | null
  loaiLop: SubjectClassType | null
  hinhThucThi: string
  trangThaiNhapDiem: string
  trangThaiNhapDiemColor: string
  monMotDauDiem: boolean
  ngayNdqt: string
  hanNdqt: string
  hanDqt: { label: string; color: "red" | "blue" | "gray" | "default" }
  ngayThi: string | null
  hanNdt: string
  hanDt: { label: string; color: "red" | "blue" | "gray" | "default" }
  giangVien1: string
  giangVien2: string
  donViPhuTrach: string
}

export const layTrangThaiNhapDiem = (record: {
  enteredScore?: boolean
  enteredExamScore?: boolean
  isLockScore?: boolean
  isLockExamScore?: boolean
  scoreDeadLineStart?: Date | string | null
}) => {
  if (record.isLockScore || record.isLockExamScore) {
    return { label: "Đã khóa điểm", color: "default" }
  }
  if (record.enteredExamScore || record.enteredScore) {
    return { label: "Đã nhập điểm TX, ĐK", color: "green" }
  }
  if (record.scoreDeadLineStart && dayjs().isAfter(dayjs(record.scoreDeadLineStart))) {
    return { label: "Đang nhập điểm quá trình", color: "processing" }
  }
  return { label: "Chưa nhập điểm", color: "red" }
}

export const layHanConLai = (
  deadline?: Date | string | null,
  daDong?: boolean
): { label: string; color: "red" | "blue" | "gray" | "default" } => {
  if (daDong) return { label: "Đã đóng", color: "gray" }
  if (!deadline) return { label: "-", color: "default" }

  const han = dayjs(deadline).endOf("day")
  const homNay = dayjs().startOf("day")
  const conLai = han.diff(homNay, "day")

  if (conLai < 0) return { label: "Hết hạn", color: "red" }
  return { label: `Còn ${conLai} ngày`, color: "blue" }
}

export const dieuKienTrangThaiNhapDiem = (trangThai: TrangThaiNhapDiemLoc) => {
  const now = new Date()
  switch (trangThai) {
    case "da_khoa":
      return { OR: [{ isLockScore: true }, { isLockExamScore: true }] }
    case "da_nhap_tx_dk":
      return {
        isLockScore: false,
        isLockExamScore: false,
        OR: [{ enteredScore: true }, { enteredExamScore: true }],
      }
    case "dang_nhap_qua_trinh":
      return {
        isLockScore: false,
        isLockExamScore: false,
        enteredScore: false,
        enteredExamScore: false,
        scoreDeadLineStart: { lte: now },
      }
    case "chua_nhap":
      return {
        isLockScore: false,
        isLockExamScore: false,
        enteredScore: false,
        enteredExamScore: false,
        OR: [{ scoreDeadLineStart: null }, { scoreDeadLineStart: { gt: now } }],
      }
    default:
      return {}
  }
}
