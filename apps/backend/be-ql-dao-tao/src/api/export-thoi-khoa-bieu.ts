import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportThoiKhoaBieu } from "../services/thoi-khoa-bieu"

const app = new OpenAPIHono()

const exportThoiKhoaBieuRoute = createRoute({
  operationId: "exportThoiKhoaBieu",
  tags: ["ThoiKhoaBieu"],
  path: "/export-thoi-khoa-bieu",
  method: "post",
  summary: "Export Thời Khóa Biểu",
  description: "Xuất thời khóa biểu ra file Excel theo học kỳ",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
            trainingCourseId: z.string().optional(),
            type: z.enum(["NORMAL", "RETAKE", "REEXAM"]).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File Excel thời khóa biểu",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportThoiKhoaBieuRoute, async (c) => {
  const { semesterId, trainingObjectTypeId, trainingCourseId, type } = c.req.valid("json")

  const result = await exportThoiKhoaBieu({
    semesterId,
    trainingObjectTypeId,
    trainingCourseId,
    type,
  })

  const fileName = "Thoi-Khoa-Bieu.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
