import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportStudentYearResult } from "../services/student-result"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const exportStudentYearResultRoute = createRoute({
  operationId: "exportStudentYearResult",
  tags: ["Kết quả học tập"],
  path: "/export-student-year-result",
  method: "post",
  summary: "Xuất KQHT theo năm học",
  description: `Xuất file Excel kết quả học tập cả năm học.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SchoolYear, Semester.

**Tham số:** semesterId (tùy chọn), schoolYearId (tùy chọn), trainingObjectTypeId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().optional().openapi(fieldDesc("ID học kỳ (nếu lọc theo HK).")),
              schoolYearId: z.string().optional().openapi(fieldDesc("ID năm học (SchoolYear).")),
              trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
            })
            .openapi("ExportStudentYearResultRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel kết quả năm học",
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

app.openapi(exportStudentYearResultRoute, async (c) => {
  const { semesterId, schoolYearId, trainingObjectTypeId } = c.req.valid("json")

  try {
    const result = await exportStudentYearResult({
      semesterId,
      schoolYearId,
      trainingObjectTypeId,
    })

    const fileName = "KET_QUA_HOC_TAP_NAM.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    if (error.code === "P2025") {
      return c.json({ message: "Data not found" }, 404)
    }
    throw error
  }
})

export default app
