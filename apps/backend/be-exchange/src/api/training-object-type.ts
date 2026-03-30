import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { TrainingObjectTypeScalar } from "../dto/scalar"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getTrainingObjectType = createRoute({
  operationId: "getTrainingObjectType",
  tags: ["TrainingObjectType"],
  path: "/get-training-object-type",
  summary: "DS Đối tượng đào tạo",
  method: "get",
  request: {},
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(TrainingObjectTypeScalar),
        },
      },
    },
  },
})

app.openapi(getTrainingObjectType, async (c) => {
  const data = await prisma.trainingObjectType.findMany({
    where: { deletedAt: null },
  })

  return c.json(data, 200)
})

export default app
