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
 * - Nếu đợt ĐK chỉ cấu hình một thang điểm (ví dụ chỉ có Base10 mà khóa học là Base4),
 *   tự động quy đổi điểm tương ứng để so khớp band phù hợp.
 */
export function matchCreditLimitByCourseBaseScore<T extends CreditLimitBand>(
  creditLimits: T[],
  courseBaseScore: AcademicRankingBaseType,
  gpaBase4: number,
  gpaBase10: number
): T | undefined {
  const useBase4 = courseBaseScore === AcademicRankingBaseType.Base4

  // 1. Khớp chính xác theo hệ điểm của khóa
  const matchedExact = creditLimits.find((item) => {
    if (item.baseScore != null && item.baseScore !== courseBaseScore) return false
    if (useBase4) {
      if (item.base4Min == null || item.base4Max == null) return false
      return gpaBase4 >= item.base4Min && gpaBase4 <= item.base4Max
    }
    if (item.base10Min == null || item.base10Max == null) return false
    return gpaBase10 >= item.base10Min && gpaBase10 <= item.base10Max
  })
  if (matchedExact) return matchedExact

  // 2. Khớp theo thang điểm 10 nếu có cấu hình base10Min/Max
  const matchedBase10 = creditLimits.find((item) => {
    if (item.base10Min == null || item.base10Max == null) return false
    const gpa = gpaBase10 > 0 ? gpaBase10 : (gpaBase4 * 10) / 4
    return gpa >= item.base10Min && gpa <= item.base10Max
  })
  if (matchedBase10) return matchedBase10

  // 3. Khớp theo thang điểm 4 nếu có cấu hình base4Min/Max
  const matchedBase4 = creditLimits.find((item) => {
    if (item.base4Min == null || item.base4Max == null) return false
    const gpa = gpaBase4 > 0 ? gpaBase4 : (gpaBase10 * 4) / 10
    return gpa >= item.base4Min && gpa <= item.base4Max
  })
  if (matchedBase4) return matchedBase4

  return undefined
}
