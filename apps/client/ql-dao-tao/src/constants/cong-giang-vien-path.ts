export const CONG_GIANG_VIEN_BASE_PATH = "/cong-giang-vien"
export const CONG_GIANG_VIEN_THONG_BAO_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/thong-bao`
export const CONG_GIANG_VIEN_LICH_CUA_TOI_PATH = `${CONG_GIANG_VIEN_BASE_PATH}/lich-cua-toi`

export const isCongGiangVienRoute = (pathname: string) =>
  pathname === CONG_GIANG_VIEN_BASE_PATH || pathname.startsWith(`${CONG_GIANG_VIEN_BASE_PATH}/`)
