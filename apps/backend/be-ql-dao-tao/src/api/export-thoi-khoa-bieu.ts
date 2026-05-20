import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportThoiKhoaBieu } from "../services/thoi-khoa-bieu"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono()

const exportThoiKhoaBieuRoute = createRoute({
  operationId: "exportThoiKhoaBieu",
  tags: ["ThoiKhoaBieu"],
  path: "/export-thoi-khoa-bieu",
  method: "post",
  summary: "Xuất thời khóa biểu Excel",
  description: `Xuất thời khóa biểu lớp học phần ra Excel.

**Bảng dữ liệu nguồn:** SubjectClass, ClassSchedule, SubjectClassTime, Semester.

**Tham số:** semesterId, trainingObjectTypeId, trainingCourseId (tùy chọn), type (NORMAL | RETAKE | REEXAM).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
              trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
              trainingCourseId: z.string().optional().openapi(fieldDesc("ID khóa học (lọc tùy chọn).")),
              type: z
                .enum(["NORMAL", "RETAKE", "REEXAM"])
                .optional()
                .openapi(fieldDesc("Loại lớp học phần.")),
            })
            .openapi("ExportThoiKhoaBieuRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File Excel thời khoá biểu",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
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
