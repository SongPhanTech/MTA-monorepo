import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })

const getTrainingField = createRoute({
  operationId: "training-field",
  tags: ["TrainingField"],
  path: "",
  method: "get",
  responses: {
    200: {
      description: "List of training fields",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              code: z.string().nullable(),
              description: z.string().nullable(),
              trainingMajors: z
                .array(
                  z.object({
                    id: z.string(),
                    code: z.string().nullable(),
                    name: z.string(),
                  })
                )
                .nullable(),
            })
          ),
        },
      },
    },
    400: {
      description: "Get fail",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(getTrainingField, async (c) => {
  try {
    const trainingFields = await prisma.trainingField.findMany({
      include: {
        trainingMajors: true,
      },
    })
    return c.json(trainingFields, 200)
  } catch (err) {
    return c.json({ message: "Failed to get TrainingField" }, 400)
  }
})

export default app
