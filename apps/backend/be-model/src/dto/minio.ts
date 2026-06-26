import { z } from "zod"
import { fieldDesc } from "./openapi-helpers"

export const PresignedUrlDtoSchema = z
  .object({
    path: z.string().openapi(fieldDesc("Đường dẫn thư mục trên MinIO.")),
    extension: z.string().openapi(fieldDesc("Phần mở rộng file.", "pdf")),
    name: z.string().nullish().openapi(fieldDesc("Tên file tùy chọn.")),
    flat: z.boolean().nullish().openapi(fieldDesc("Lưu phẳng không tạo subfolder.", false)),
  })
  .openapi("PresignedUrlDto")

export const ListObjectDtoSchema = z
  .object({
    path: z.string().optional().openapi(fieldDesc("Prefix thư mục cần liệt kê.")),
    startAfter: z.string().optional().openapi(fieldDesc("Object name bắt đầu sau (phân trang).")),
    limit: z.coerce.number().openapi(fieldDesc("Số object tối đa trả về.", 100)),
  })
  .openapi("ListObjectDto")

export const BucketItemDtoSchema = z
  .object({
    name: z.string().optional().openapi(fieldDesc("Tên object.")),
    size: z.number().optional().openapi(fieldDesc("Kích thước (bytes).")),
    etag: z.string().optional().openapi(fieldDesc("ETag của object.")),
    prefix: z.string().optional().openapi(fieldDesc("Prefix thư mục.")),
    lastModified: z.date().optional().openapi(fieldDesc("Thời gian sửa đổi cuối.")),
  })
  .openapi("BucketItemDto")

export const UrlDtoSchema = z
  .object({
    url: z.string().openapi(fieldDesc("URL presigned để upload/download.")),
    fileName: z.string().openapi(fieldDesc("Tên file trên MinIO.")),
  })
  .openapi("UrlDto")

export const ConvertDocumentResponseSchema = z
  .object({
    fileUrl: z.string().url().openapi(fieldDesc("URL file đã chuyển đổi từ OnlyOffice.")),
  })
  .openapi("ConvertDocumentResponse")

export type PresignedUrlDto = z.infer<typeof PresignedUrlDtoSchema>
export type ListObjectDto = z.infer<typeof ListObjectDtoSchema>
export type BucketItemDto = z.infer<typeof BucketItemDtoSchema>
export type UrlDto = z.infer<typeof UrlDtoSchema>
