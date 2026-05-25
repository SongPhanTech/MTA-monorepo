import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

const TrainingMajorItemSchema = z.object({
  id: z.string().openapi(fieldDesc("ID ngành (TrainingMajor).")),
  code: z.string().nullable().openapi(fieldDesc("Mã ngành.")),
  name: z.string().openapi(fieldDesc("Tên ngành.")),
})

const TrainingFieldItemSchema = z.object({
  id: z.string().openapi(fieldDesc("ID lĩnh vực (TrainingField).")),
  name: z.string().openapi(fieldDesc("Tên lĩnh vực đào tạo.")),
  code: z.string().nullable().openapi(fieldDesc("Mã lĩnh vực.")),
  description: z.string().nullable().openapi(fieldDesc("Mô tả.")),
  trainingMajors: z
    .array(TrainingMajorItemSchema)
    .nullable()
    .openapi(fieldDesc("Danh sách ngành thuộc lĩnh vực.")),
})

const getTrainingField = createRoute({
  operationId: "training-field",
  tags: ["Lĩnh vực đào tạo"],
  path: "",
  method: "get",
  summary: "Danh sách lĩnh vực đào tạo",
  description: `Lấy lĩnh vực đào tạo kèm các ngành (training majors).

**Bảng dữ liệu nguồn:** TrainingField, TrainingMajor.

**Tham số:** không có.`,
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(TrainingFieldItemSchema),
        },
      },
    },
    400: {
      description: "Lỗi truy vấn",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi(fieldDesc("Thông báo lỗi.")),
          }),
        },
      },
    },
  },
})

app.openapi(getTrainingField, async (c) => {
  try {
    const trainingFields = await prisma.trainingField.findMany({
      include: {
        trainingMajors: true,
      },
    })
    return c.json(trainingFields, 200)
  } catch (err) {
    return c.json({ message: "Failed to get TrainingField" }, 400)
  }
})

export default app
