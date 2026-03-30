import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { TrainingMajorScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getTrainingMajor = createRoute({
  operationId: "getTrainingMajor",
  tags: ["TrainingMajor"],
  path: "/get-training-major",
  summary: "DS chuyên ngành đào tạo",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(TrainingMajorScalar),
        },
      },
    },
  },
})

app.openapi(getTrainingMajor, async (c) => {
  const data = await prisma.trainingMajor.findMany({
    where: { deletedAt: null },
  })

  return c.json(data, 200)
})

export default app
