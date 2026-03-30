import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })

const getRoom = createRoute({
  operationId: "room",
  tags: ["Room"],
  path: "",
  method: "get",
  responses: {
    200: {
      description: "List of room",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              code: z.string().nullable(),
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

app.openapi(getRoom, async (c) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        building: true,
      },
    })
    return c.json(rooms, 200)
  } catch (err) {
    return c.json({ message: "Failed to get TrainingField" }, 400)
  }
})

export default app
