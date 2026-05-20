import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const RequestSchema = z
  .object({
    preview: z
      .boolean()
      .optional()
      .default(false)
      .openapi(fieldDesc("true = trả dữ liệu mẫu, không truy vấn DB.", false)),
    labels: z
      .array(z.enum(["target", "admitted", "enrolled", "rate"]))
      .optional()
      .default(["target", "admitted", "enrolled", "rate"])
      .openapi(
        fieldDesc(
          "Các cột thống kê cần trả về: target (chỉ tiêu), admitted (trúng tuyển), enrolled (nhập học), rate (tỷ lệ)."
        )
      ),
    trainingLevelNames: z
      .array(z.string())
      .optional()
      .openapi(fieldDesc("Lọc theo tên bậc đào tạo (TrainingLevel.name).")),
    includeEmpty: z
      .boolean()
      .optional()
      .default(false)
      .openapi(fieldDesc("Có bao gồm các dòng không có dữ liệu hay không.", false)),
  })
  .openapi("AdmissionStatisticsRequest")

export const ResponseSchema = z
  .object({
    year: z.string().openapi(fieldDesc("Năm tuyển sinh / niên khóa.", "2024")),
    objectType: z.string().openapi(fieldDesc("Đối tượng đào tạo (TrainingObjectType).", "SQ")),
    trainingLevel: z.string().openapi(fieldDesc("Bậc đào tạo (TrainingLevel).", "Đại học")),
    target: z.number().optional().openapi(fieldDesc("Chỉ tiêu tuyển sinh.")),
    admitted: z.number().optional().openapi(fieldDesc("Số trúng tuyển.")),
    enrolled: z.number().optional().openapi(fieldDesc("Số nhập học.")),
    rate: z.number().optional().openapi(fieldDesc("Tỷ lệ nhập học / trúng tuyển (%).")),
  })
  .openapi("AdmissionStatisticsRow")
