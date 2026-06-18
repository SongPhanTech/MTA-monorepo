export const CONG_GIANG_VIEN_BASE_PATH = "/cong-giang-vien"
export const CONG_GIANG_VIEN_THONG_BAO_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/thong-bao`
export const CONG_GIANG_VIEN_LICH_CUA_TOI_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lich-cua-toi`
export const CONG_GIANG_VIEN_LOP_QUAN_LY_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-quan-ly`
export const CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-tro-giang`
export const CONG_GIANG_VIEN_LOP_GIANG_DAY_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-giang-day/danh-sach-lop-giang-day`
export const CONG_GIANG_VIEN_DIEM_DANH_PATH = `${CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH}/diem-danh`
export const CONG_GIANG_VIEN_CHI_TIET_MON_HOC_PATH = `${CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH}/chi-tiet`
export const CONG_GIANG_VIEN_DIEM_DANH_GIANG_DAY_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-giang-day/diem-danh`
export const CONG_GIANG_VIEN_NHAP_DIEM_QUA_TRINH_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-giang-day/nhap-diem-qua-trinh`
export const CONG_GIANG_VIEN_NHAP_DIEM_THI_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-giang-day/nhap-diem-thi`

export const chiTietLopQuanLyPath = (id: string) => `${CONG_GIANG_VIEN_LOP_QUAN_LY_PATH}/${id}`

/** Mở màn điểm danh, có thể truyền sẵn lớp môn học cần điểm danh. */
export const diemDanhTroGiangPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CONG_GIANG_VIEN_DIEM_DANH_PATH}?lopId=${subjectClassId}`
    : CONG_GIANG_VIEN_DIEM_DANH_PATH

/** Mở màn chi tiết môn học của lớp trợ giảng theo phiên bản môn học (kèm lớp để lấy ngôn ngữ giảng dạy). */
export const chiTietMonHocTroGiangPath = (subjectVersionId?: string, subjectClassId?: string) => {
  if (!subjectVersionId) return CONG_GIANG_VIEN_CHI_TIET_MON_HOC_PATH
  const params = new URLSearchParams({ subjectVersionId })
  if (subjectClassId) params.set("lopId", subjectClassId)
  return `${CONG_GIANG_VIEN_CHI_TIET_MON_HOC_PATH}?${params.toString()}`
}

export const diemDanhGiangDayPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CONG_GIANG_VIEN_DIEM_DANH_GIANG_DAY_PATH}?lopId=${subjectClassId}`
    : CONG_GIANG_VIEN_DIEM_DANH_GIANG_DAY_PATH

export const nhapDiemQuaTrinhGiangDayPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CONG_GIANG_VIEN_NHAP_DIEM_QUA_TRINH_PATH}?lopId=${subjectClassId}`
    : CONG_GIANG_VIEN_NHAP_DIEM_QUA_TRINH_PATH

export const nhapDiemThiGiangDayPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CONG_GIANG_VIEN_NHAP_DIEM_THI_PATH}?lopId=${subjectClassId}`
    : CONG_GIANG_VIEN_NHAP_DIEM_THI_PATH

export const hoSoSinhVienLopQuanLyPath = (fixedClassId: string, studentId: string) =>
  `${CONG_GIANG_VIEN_LOP_QUAN_LY_PATH}/${fixedClassId}/sinh-vien/${studentId}`

export const ketQuaHocTapSinhVienLopQuanLyPath = (fixedClassId: string, studentId: string) =>
  `${CONG_GIANG_VIEN_LOP_QUAN_LY_PATH}/${fixedClassId}/sinh-vien/${studentId}/ket-qua-hoc-tap`

export const isCongGiangVienRoute = (pathname: string) =>
  pathname === CONG_GIANG_VIEN_BASE_PATH || pathname.startsWith(`${CONG_GIANG_VIEN_BASE_PATH}/`)
