import { z } from "zod"

export const PresignedUrlDtoSchema = z
  .object({ path: z.string(), extension: z.string(), name: z.string().nullish() })
  .openapi("PresignedUrlDto")

export const ListObjectDtoSchema = z
  .object({
    path: z.string().optional(),
    startAfter: z.string().optional(),
    limit: z.number(),
  })
  .openapi("ListObjectDto")

export const BucketItemDtoSchema = z
  .object({
    name: z.string().optional(),
    size: z.number().optional(),
    etag: z.string().optional(),
    prefix: z.string().optional(),
    lastModified: z.date().optional(),
  })
  .openapi("BucketItemDto")

export const UrlDtoSchema = z
  .object({
    url: z.string(),
    fileName: z.string(),
  })
  .openapi("UrlDto")

export type PresignedUrlDto = z.infer<typeof PresignedUrlDtoSchema>
export type ListObjectDto = z.infer<typeof ListObjectDtoSchema>
export type BucketItemDto = z.infer<typeof BucketItemDtoSchema>
export type UrlDto = z.infer<typeof UrlDtoSchema>
