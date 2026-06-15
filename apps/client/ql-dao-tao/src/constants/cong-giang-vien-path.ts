export const CONG_GIANG_VIEN_BASE_PATH = "/cong-giang-vien"
export const CONG_GIANG_VIEN_THONG_BAO_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/thong-bao`
export const CONG_GIANG_VIEN_LICH_CUA_TOI_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lich-cua-toi`
export const CONG_GIANG_VIEN_LOP_QUAN_LY_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-quan-ly`
export const CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lop-tro-giang`
export const CONG_GIANG_VIEN_DIEM_DANH_PATH = `${CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH}/diem-danh`

export const chiTietLopQuanLyPath = (id: string) => `${CONG_GIANG_VIEN_LOP_QUAN_LY_PATH}/${id}`

/** Mở màn điểm danh, có thể truyền sẵn lớp môn học cần điểm danh. */
export const diemDanhTroGiangPath = (subjectClassId?: string) =>
  subjectClassId
    ? `${CONG_GIANG_VIEN_DIEM_DANH_PATH}?lopId=${subjectClassId}`
    : CONG_GIANG_VIEN_DIEM_DANH_PATH

export const hoSoSinhVienLopQuanLyPath = (fixedClassId: string, studentId: string) =>
  `${CONG_GIANG_VIEN_LOP_QUAN_LY_PATH}/${fixedClassId}/sinh-vien/${studentId}`

export const isCongGiangVienRoute = (pathname: string) =>
  pathname === CONG_GIANG_VIEN_BASE_PATH || pathname.startsWith(`${CONG_GIANG_VIEN_BASE_PATH}/`)
