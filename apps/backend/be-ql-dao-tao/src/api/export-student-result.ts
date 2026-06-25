import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportStudentSemesterResult } from "../services/student-result"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const exportStudentSemesterResultRoute = createRoute({
  operationId: "exportStudentSemesterResult",
  tags: ["Kết quả học tập"],
  path: "/export-student-semester-result",
  method: "post",
  summary: "Xuất KQHT theo học kỳ",
  description: `Xuất file Excel kết quả học tập học kỳ.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, Semester, TrainingObjectType.

**Tham số:** semesterId, trainingObjectTypeId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi(fieldDesc("ID học kỳ (Semester).")),
              trainingObjectTypeId: z
                .string()
                .openapi(fieldDesc("ID hệ đào tạo (TrainingObjectType).")),
              fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp học (FixedClass).")),
            })
            .openapi("ExportStudentSemesterResultRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel kết quả học tập",
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

app.openapi(exportStudentSemesterResultRoute, async (c) => {
  const { semesterId, trainingObjectTypeId, fixedClassId } = c.req.valid("json")

  const result = await exportStudentSemesterResult({
    semesterId,
    trainingObjectTypeId,
    fixedClassId,
  })

  const fileName = "KET_QUA_HOC_TAP_HK.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
