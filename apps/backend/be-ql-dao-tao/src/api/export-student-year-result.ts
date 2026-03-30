import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportStudentYearResult } from "../services/student-result"

const app = new OpenAPIHono()

const exportStudentYearResultRoute = createRoute({
  operationId: "exportStudentYearResult",
  tags: ["Student Result"],
  path: "/export-student-year-result",
  method: "post",
  summary: "Export Student Year Result",
  description: "Export student year result to Excel",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            semesterId: z.string().optional(),
            schoolYearId: z.string().optional(),
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
