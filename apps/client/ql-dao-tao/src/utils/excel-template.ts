import { customModelFetch } from "@workspace/libs/api/custom-instance"
import { ExcelTemplateBody } from "@workspace/libs/api/schemas";

export interface CustomModelResponse<T> {
  status: number
  data: T
  headers: Headers
}

/**
 * Render template Excel ở backend, lưu file tạm lên MinIO và trả về object path để preview.
 * Dùng cho các nút "xem trước" thay vì tải thẳng file.
 */
export const previewExcelTemplate = (
  body: ExcelTemplateBody & { previewKey: string }
): Promise<CustomModelResponse<{ path: string; fileType: string }>> => {
  return customModelFetch<CustomModelResponse<{ path: string; fileType: string }>>(
    "/api/excel-template/preview",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
}
