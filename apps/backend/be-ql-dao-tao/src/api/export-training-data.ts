import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { exportTrainingData } from "../services/export-training-data"

const app = new OpenAPIHono()

const exportTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z.string().optional().openapi(
      fieldDesc("Tùy chọn, giữ tương thích. Xuất luôn toàn bộ dữ liệu, không lọc theo đợt.")
    ),
  })
  .openapi("ExportTrainingDataRequest")

const exportTrainingDataResponseSchema = z
  .object({
    version: z.string(),
    exportedAt: z.string(),
    filters: z.object({
      scope: z.literal("full"),
      classRegisterSessionIds: z.array(z.string()),
      semesterIds: z.array(z.string()),
      trainingCourseIds: z.array(z.string()),
    }),
    counts: z.object({}).catchall(z.number()),
    data: z.object({}).catchall(z.array(z.object({}).catchall(z.any()))),
  })
  .openapi("ExportTrainingDataResponse")

const exportTrainingDataRoute = createRoute({
  operationId: "exportTrainingData",
  tags: ["Xuất dữ liệu"],
  path: "/export",
  method: "post",
  summary: "Xuất toàn bộ dữ liệu thô sang môi trường internet",
  description: `Xuất gói JSON toàn bộ (version 1.4.0) để migrate sang cổng internet / import ngược.

**Phạm vi (không lọc 1 đợt):**
- Đợt đăng ký học + hạn mức tín chỉ + gắn khóa
- Lớp học phần, thời khóa biểu (SubjectClassTime, ClassSchedule), phòng/cơ sở
- Sinh viên, hồ sơ UserProfile (SV/GV/CB), lớp niên chế, giảng viên, cán bộ
- Danh mục hệ thống DM_* và catalog đào tạo
- Chương trình đào tạo, khối, môn, phiên bản môn, tiên quyết/tương đương
- Điểm lớp học phần + kết quả học kỳ của sinh viên **mọi kỳ**

**Tham số:** classRegisterSessionId (optional, không dùng để lọc).`,
  request: {
    body: {
      required: false,
      content: {
        "application/json": {
          schema: exportTrainingDataRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Gói dữ liệu JSON toàn bộ",
      content: {
        "application/json": {
          schema: exportTrainingDataResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportTrainingDataRoute, async (c) => {
  try {
    const result = await exportTrainingData()
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất dữ liệu thất bại"
    return c.json({ message }, 500)
  }
})

export default app
