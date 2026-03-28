import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { FixedClassScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getFixedClass = createRoute({
  operationId: "getFixedClass",
  tags: ["FixedClass"],
  path: "/get-fixed-class",
  summary: "DS lớp quản lý",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(FixedClassScalar),
        },
      },
    },
  },
})

app.openapi(getFixedClass, async (c) => {
  const data = await prisma.fixedClass.findMany({
    where: { deletedAt: null },
  })

  return c.json(data, 200)
})

export default app
