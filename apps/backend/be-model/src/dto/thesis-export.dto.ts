import { z } from "@hono/zod-openapi"

/** Filter chung cho mọi mẫu in luận văn. */
export const ThesisExportFilterSchema = z
  .object({
    thesisSessionId: z.string().min(1).openapi({ description: "ID đợt xét luận văn." }),
    trainingCourseIds: z
      .array(z.string())
      .optional()
      .openapi({ description: "Danh sách ID khóa đào tạo (để suy lớp nếu không gửi fixedClassIds)." }),
    fixedClassIds: z
      .array(z.string())
      .optional()
      .openapi({ description: "Danh sách ID lớp biên chế trong phạm vi lọc." }),
    organizationId: z
      .string()
      .optional()
      .openapi({ description: "ID khoa quản lý (organization) của đề tài (một giá trị)." }),
    organizationIds: z
      .array(z.string())
      .optional()
      .openapi({ description: "Danh sách ID khoa quản lý (organization) của đề tài." }),
    signerName: z.string().optional().openapi({ description: "Tên người ký (mẫu needSign)." }),
    isChief: z.boolean().optional().openapi({ description: "true = ký với tư cách thủ trưởng." }),
    signingDate: z
      .string()
      .optional()
      .openapi({ description: "Ngày ký ISO / parse được bởi dayjs." }),
    moneyAmount: z.number().optional().openapi({ description: "Số tiền (mẫu DS chuyên gia)." }),
    recreateAllPayments: z
      .boolean()
      .optional()
      .openapi({ description: "true = cập nhật lại toàn bộ bản ghi thanh toán trước khi xuất." }),
  })
  .openapi("ThesisExportFilter")

export type ThesisExportFilter = z.infer<typeof ThesisExportFilterSchema>
