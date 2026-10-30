/** Các kỳ CTĐT duy nhất được in trên bảng điểm Dự khóa. */
export const DU_KHOA_PLANNED_SEMESTERS = [1, 2] as const

/**
 * `undefined` biểu thị để backend tự áp dụng chính sách Dự khóa.
 * Nếu client vẫn gửi kỳ lên, chỉ chấp nhận đúng tập kỳ 1 và 2.
 */
export function isValidDuKhoaSemesterRequest(semesters?: number[]): boolean {
  if (!semesters?.length) return true
  const uniqueSemesters = [...new Set(semesters)].sort((a, b) => a - b)
  return (
    uniqueSemesters.length === DU_KHOA_PLANNED_SEMESTERS.length &&
    uniqueSemesters.every((semester, index) => semester === DU_KHOA_PLANNED_SEMESTERS[index])
  )
}
