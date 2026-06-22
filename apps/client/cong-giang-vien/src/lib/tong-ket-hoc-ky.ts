import { AcademicRankingBaseType, type AcademicRankingConvert } from "@workspace/db/client"

type KetQuaHocKy = {
  gpaBase4?: unknown
  gpaBase10?: unknown
}

export type KetQuaPhanLoaiTotNghiep = {
  classification: string | null
  graduated: boolean
  rankOrder: number | null
}

export const layHeDiem = (baseScore?: AcademicRankingBaseType | null) =>
  baseScore === AcademicRankingBaseType.Base4 ? 4 : 10

export const layDiemToiDa = (baseScore?: AcademicRankingBaseType | null) => layHeDiem(baseScore)

/** Xác định hệ điểm từ cấu hình xếp loại tốt nghiệp của khóa (giống modal in KQHT). */
export const layHeDiemTotNghiep = (
  xepLoaiTotNghiep: AcademicRankingConvert[],
  fallback?: AcademicRankingBaseType | null
) => {
  const tuCauHinh =
    xepLoaiTotNghiep.find((item) => item.base4Min != null)?.baseScore ??
    xepLoaiTotNghiep[0]?.baseScore
  return layHeDiem(tuCauHinh ?? fallback)
}

export const layGpaHocKy = (
  ketQua?: KetQuaHocKy | null,
  baseScore?: AcademicRankingBaseType | null
) => {
  if (!ketQua || !baseScore) return null
  if (baseScore === AcademicRankingBaseType.Base4) {
    const value = ketQua.gpaBase4
    return value != null ? Number(value) : null
  }
  const value = ketQua.gpaBase10
  return value != null ? Number(value) : null
}

export const dinhDangGpa = (value: number | null | undefined) =>
  value != null ? value.toFixed(2).replace(".", ",") : "—"

/**
 * Phân loại điểm theo cấu hình xếp loại tốt nghiệp của khóa.
 * Khớp khoảng [min, max] inclusive — cùng logic backend `phanLoaiDiemHe4/He10`.
 */
export const phanLoaiDiemTotNghiep = (
  score: number | null | undefined,
  xepLoaiTotNghiep: AcademicRankingConvert[],
  baseScore: AcademicRankingBaseType
): KetQuaPhanLoaiTotNghiep => {
  if (score == null || xepLoaiTotNghiep.length === 0) {
    return { classification: null, graduated: false, rankOrder: null }
  }

  const matched = xepLoaiTotNghiep.find((item) =>
    baseScore === AcademicRankingBaseType.Base4
      ? item.base4Min != null &&
        item.base4Max != null &&
        score >= item.base4Min &&
        score <= item.base4Max
      : item.base10Min != null &&
        item.base10Max != null &&
        score >= item.base10Min &&
        score <= item.base10Max
  )

  return {
    classification: matched?.classification ?? null,
    graduated: matched?.graduated ?? false,
    rankOrder: matched?.rankOrder ?? null,
  }
}

/** Ngưỡng điểm tối thiểu để đạt (graduated = true) theo cấu hình khóa. */
export const layNguongDatTotNghiep = (
  xepLoaiTotNghiep: AcademicRankingConvert[],
  baseScore: AcademicRankingBaseType
) => {
  const dat = xepLoaiTotNghiep.filter((item) => item.graduated)
  if (dat.length === 0) return null

  if (baseScore === AcademicRankingBaseType.Base4) {
    const mins = dat.map((item) => item.base4Min).filter((v): v is number => v != null)
    return mins.length > 0 ? Math.min(...mins) : null
  }

  const mins = dat.map((item) => item.base10Min).filter((v): v is number => v != null)
  return mins.length > 0 ? Math.min(...mins) : null
}

/** rankOrder của mức "Trung bình" (không tính "Trung bình khá") — dùng cho thống kê TB trở xuống. */
export const layRankOrderTbTroXuong = (xepLoaiTotNghiep: AcademicRankingConvert[]) => {
  const tb = xepLoaiTotNghiep.find((item) => {
    const key = item.classification.toLowerCase()
    return key.includes("trung bình") && !key.includes("khá")
  })
  return tb?.rankOrder ?? null
}

export const laHocLucTbTroXuong = (rankOrder: number | null, nguongRankOrder: number | null) => {
  if (rankOrder == null || nguongRankOrder == null) return false
  return rankOrder >= nguongRankOrder
}

export const mauXepLoaiHocLuc = (classification: string | null | undefined) => {
  if (!classification) return "default"
  const key = classification.toLowerCase()
  if (key.includes("xuất sắc")) return "green"
  if (key.includes("giỏi")) return "cyan"
  if (key.includes("khá")) return "blue"
  if (key.includes("trung bình khá")) return "gold"
  if (key.includes("trung bình")) return "orange"
  if (key.includes("yếu") || key.includes("không đạt")) return "red"
  return "default"
}

export const dinhDangNguong = (value: number | null | undefined) =>
  value != null ? value.toFixed(2).replace(".", ",") : "—"
