import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportStudentSemesterResult } from "../services/student-result"

const app = new OpenAPIHono()

const exportStudentSemesterResultRoute = createRoute({
  operationId: "exportStudentSemesterResult",
  tags: ["Student Result"],
  path: "/export-student-semester-result",
  method: "post",
  summary: "Export Student Semester Result",
  description: "Export student semester result to Excel",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            semesterId: z.string(),
            trainingObjectTypeId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
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

app.openapi(exportStudentSemesterResultRoute, async (c) => {
  const { semesterId, trainingObjectTypeId } = c.req.valid("json")

  const result = await exportStudentSemesterResult({ semesterId, trainingObjectTypeId })

  const fileName = "KET_QUA_HOC_TAP_HK.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
