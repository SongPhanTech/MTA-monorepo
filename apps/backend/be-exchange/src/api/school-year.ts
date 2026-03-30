import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { SchoolYearScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getSchoolYear = createRoute({
  operationId: "getSchoolYear",
  tags: ["SchoolYear"],
  path: "/get-school-year",
  summary: "DS năm học",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(SchoolYearScalar),
        },
      },
    },
  },
})

app.openapi(getSchoolYear, async (c) => {
  const data = await prisma.schoolYear.findMany({
    where: { deletedAt: null },
    include: { semesters: true },
  })

  return c.json(data, 200)
})

export default app
