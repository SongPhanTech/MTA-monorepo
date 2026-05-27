/** Mô tả trường cho OpenAPI (Scalar / Swagger). */
export function fieldDesc(description: string): { description: string }
export function fieldDesc(
  description: string,
  example: string
): { description: string; example: string }
export function fieldDesc(
  description: string,
  example: number
): { description: string; example: number }
export function fieldDesc(
  description: string,
  example: boolean
): { description: string; example: boolean }
export function fieldDesc(description: string, example?: string | number | boolean) {
  return example === undefined ? { description } : { description, example }
}

export const API_RESULT = {
  SUCCESS_CODE: { description: "Mã kết quả. 000 = thành công." },
  SUCCESS_DESC: { description: "Mô tả kết quả. success = thành công." },
  ERROR_CODE: {
    description:
      "Mã lỗi: 401 = không có đợt đăng ký; 411 = không tìm thấy sinh viên; 412 = sinh viên chưa có lớp; 421 = không có CTĐT; 431 = không tìm thấy lớp học phần.",
  },
  ERROR_DESC: { description: "Mô tả lỗi bằng tiếng Việt." },
} as const
