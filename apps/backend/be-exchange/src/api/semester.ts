import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { SemesterScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getSemester = createRoute({
  operationId: "getSemester",
  tags: ["Semester"],
  path: "/get-semester",
  summary: "DS học kỳ",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(SemesterScalar),
        },
      },
    },
  },
})

app.openapi(getSemester, async (c) => {
  const data = await prisma.semester.findMany({
    where: { deletedAt: null },
  })

  return c.json(data, 200)
})

export default app
