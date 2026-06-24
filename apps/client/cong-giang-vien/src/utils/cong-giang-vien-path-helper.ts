// Helper dựng đường dẫn cho cổng giảng viên.
// Đường dẫn tĩnh dùng thẳng ROUTER_PATH.CONG_GIANG_VIEN.*; ở đây chỉ giữ các hàm
// dựng path động ([id]) và đính kèm query string để tránh lặp logic.
import { ROUTER_PATH } from "@workspace/router"

const CGV = ROUTER_PATH.CONG_GIANG_VIEN

export const chiTietLopQuanLyPath = (id: string) => CGV.LOP_QUAN_LY_ID.replace("[id]", id)

/** Mở màn điểm danh, có thể truyền sẵn lớp môn học cần điểm danh. */
export const diemDanhTroGiangPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CGV.LOP_TRO_GIANG_DIEM_DANH}?lopId=${subjectClassId}`
    : CGV.LOP_TRO_GIANG_DIEM_DANH

/** Mở màn chi tiết môn học của lớp trợ giảng theo phiên bản môn học (kèm lớp để lấy ngôn ngữ giảng dạy). */
export const chiTietMonHocTroGiangPath = (subjectVersionId?: string, subjectClassId?: string) => {
  if (!subjectVersionId) return CGV.LOP_TRO_GIANG_CHI_TIET
  const params = new URLSearchParams({ subjectVersionId })
  if (subjectClassId) params.set("lopId", subjectClassId)
  return `${CGV.LOP_TRO_GIANG_CHI_TIET}?${params.toString()}`
}

/** Mở màn điểm danh; có thể truyền sẵn lớp và ngày học (YYYY-MM-DD). */
export const diemDanhGiangDayPath = (subjectClassId?: string, ngay?: string) => {
  if (!subjectClassId) return CGV.LOP_GIANG_DAY_DIEM_DANH

  const params = new URLSearchParams({ lopId: subjectClassId })
  if (ngay?.trim()) params.set("ngay", ngay.trim())

  return `${CGV.LOP_GIANG_DAY_DIEM_DANH}?${params.toString()}`
}

export const nhapDiemQuaTrinhGiangDayPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CGV.LOP_GIANG_DAY_NHAP_DIEM_QUA_TRINH}?lopId=${subjectClassId}`
    : CGV.LOP_GIANG_DAY_NHAP_DIEM_QUA_TRINH

export const nhapDiemThiGiangDayPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CGV.LOP_GIANG_DAY_NHAP_DIEM_THI}?lopId=${subjectClassId}`
    : CGV.LOP_GIANG_DAY_NHAP_DIEM_THI

/** Mở màn khảo sát, có thể truyền sẵn khảo sát cần trả lời để mở nhanh. */
export const khaoSatGiangVienPath = (surveyId?: string) =>
  surveyId ? `${CGV.KHAO_SAT}?surveyId=${surveyId}` : CGV.KHAO_SAT

/** Mở màn chi tiết môn học của lớp giảng dạy theo phiên bản môn học (kèm lớp để lấy ngôn ngữ giảng dạy). */
export const chiTietMonHocGiangDayPath = (subjectVersionId?: string, subjectClassId?: string) => {
  if (!subjectVersionId) return CGV.LOP_GIANG_DAY_CHI_TIET
  const params = new URLSearchParams({ subjectVersionId })
  if (subjectClassId) params.set("lopId", subjectClassId)
  return `${CGV.LOP_GIANG_DAY_CHI_TIET}?${params.toString()}`
}

export const hoSoSinhVienLopQuanLyPath = (fixedClassId: string, studentId: string) =>
  CGV.LOP_QUAN_LY_ID_SINH_VIEN_STUDENTID.replace("[id]", fixedClassId).replace(
    "[studentId]",
    studentId
  )

export const ketQuaHocTapSinhVienLopQuanLyPath = (fixedClassId: string, studentId: string) =>
  CGV.LOP_QUAN_LY_ID_SINH_VIEN_STUDENTID_KET_QUA_HOC_TAP.replace("[id]", fixedClassId).replace(
    "[studentId]",
    studentId
  )
