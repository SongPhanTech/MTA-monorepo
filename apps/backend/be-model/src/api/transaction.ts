import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { Prisma } from "@workspace/db"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })
app.openapi(
  createRoute({
    operationId: "sqlTransaction",
    path: "/transaction",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                model: z.nativeEnum(Prisma.ModelName),
                operation: z.string(),
                data: z.any(),
              })
            ),
          },
        },
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: z.array(z.any()) } },
        description: "Execute SQL transaction",
      },
    },
  }),
  async (c) => {
    const data = c.req.valid("json")
    const res = await prisma.$transaction(async (tx) => {
      const result = []
      for (const element of data) {
        const key = (element.model.charAt(0).toLowerCase() +
          element.model.slice(1)) as keyof Prisma.TransactionClient
        // as keyof Prisma.TransactionClient
        if (!tx[key]) {
          throw new Error(`Model ${element.model} not found in transaction`)
        }
        const operation = element.operation as any
        if (!operation) {
          throw new Error(`Operation ${element.operation} not found in model ${element.model}`)
        }
        // @ts-expect-error
        result.push(await tx[key][operation](element.data))
      }
      return result
    })
    return c.json(res)
  }
)

export default app
