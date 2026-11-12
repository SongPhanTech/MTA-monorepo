/**
 * So sánh dòng cấu hình đề: dòng có loại câu hỏi cụ thể xử lý trước,
 * dòng "Tất cả" (type = null) xử lý sau, để dòng "Tất cả" không "ăn" mất
 * câu hỏi mà dòng cụ thể (cùng mức độ, cùng điểm) cần dùng.
 */
export const compareConfigExamByType = (
  a: { type?: string | null },
  b: { type?: string | null }
) => Number(a.type == null) - Number(b.type == null)
