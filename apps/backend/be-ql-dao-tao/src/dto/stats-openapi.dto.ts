import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const PreviewOnlyRequestSchema = z
  .object({
    preview: z
      .boolean()
      .default(false)
      .openapi(fieldDesc("true = trả dữ liệu mẫu (faker), không truy vấn DB.", false)),
  })
  .openapi("StatsPreviewOnlyRequest")

export const PreviewWithManagementOrgRequestSchema = PreviewOnlyRequestSchema.extend({
  managementOrganizationId: z
    .string()
    .uuid()
    .openapi(fieldDesc("ID đơn vị quản lý (ManagementOrganization / DM_DonVi).")),
}).openapi("StatsPreviewWithManagementOrgRequest")

export const PreviewWithSemesterRequestSchema = PreviewOnlyRequestSchema.extend({
  semesterId: z.string().openapi(fieldDesc("ID học kỳ (Semester.id).")),
}).openapi("StatsPreviewWithSemesterRequest")

export const StudentsOfInterestRequestSchema = PreviewOnlyRequestSchema.extend({
  warningLevel: z
    .string()
    .optional()
    .openapi(fieldDesc("Mức cảnh báo học tập (lọc tùy chọn).")),
  debtCredits: z.string().optional().openapi(fieldDesc("Ngưỡng tín chỉ nợ (lọc tùy chọn).")),
  gpaThreshold: z.string().optional().openapi(fieldDesc("Ngưỡng GPA (lọc tùy chọn).")),
}).openapi("StatsStudentsOfInterestRequest")

export const StatBaseResponseSchema = z
  .object({
    summary: z.record(z.string(), z.any()).openapi(fieldDesc("Tóm tắt / metadata bổ sung.")),
    count: z.number().openapi(fieldDesc("Số bản ghi trong data.")),
    preview: z.boolean().default(false).openapi(fieldDesc("Có phải dữ liệu xem trước không.")),
    labels: z.array(z.string()).optional().openapi(fieldDesc("Nhãn cột hiển thị trên UI.")),
  })
  .openapi("StatBaseResponse")
