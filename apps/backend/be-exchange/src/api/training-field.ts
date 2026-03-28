import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { TrainingFieldScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getTrainingField = createRoute({
  operationId: "getTrainingField",
  tags: ["TrainingField"],
  path: "/get-training-field",
  summary: "DS ngành đào tạo",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(TrainingFieldScalar),
        },
      },
    },
  },
})

app.openapi(getTrainingField, async (c) => {
  const data = await prisma.trainingField.findMany({
    where: { deletedAt: null },
  })

  return c.json(data, 200)
})

export default app
