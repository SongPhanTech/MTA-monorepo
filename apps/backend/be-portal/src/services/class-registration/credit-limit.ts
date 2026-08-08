import { AcademicRankingBaseType } from "@workspace/db"

export type CreditLimitBand = {
  baseScore?: AcademicRankingBaseType | null
  base4Min?: number | null
  base4Max?: number | null
  base10Min?: number | null
  base10Max?: number | null
  minCredit?: number | null
  maxCredit?: number | null
}

/**
 * Chọn giới hạn TC theo cấu hình hệ điểm của khóa SV + GPA kỳ gần nhất.
 * - Khóa Base4 → so gpaBase4 với bản ghi baseScore=Base4 (base4Min/Max)
 * - Khóa Base10 → so gpaBase10 với bản ghi baseScore=Base10 (base10Min/Max)
 */
export function matchCreditLimitByCourseBaseScore<T extends CreditLimitBand>(
  creditLimits: T[],
  courseBaseScore: AcademicRankingBaseType,
  gpaBase4: number,
  gpaBase10: number
): T | undefined {
  const useBase4 = courseBaseScore === AcademicRankingBaseType.Base4
  const gpa = useBase4 ? gpaBase4 : gpaBase10

  return creditLimits.find((item) => {
    // Ưu tiên bản ghi đúng hệ điểm của khóa (đợt ĐK lưu tách Base4 / Base10)
    if (item.baseScore != null && item.baseScore !== courseBaseScore) return false

    if (useBase4) {
      if (item.base4Min == null || item.base4Max == null) return false
      return gpa >= item.base4Min && gpa <= item.base4Max
    }
    if (item.base10Min == null || item.base10Max == null) return false
    return gpa >= item.base10Min && gpa <= item.base10Max
  })
}
