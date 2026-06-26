import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { Prisma } from "@workspace/db"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { prisma } from ".."

const SqlTransactionItemSchema = z
  .object({
    model: z.nativeEnum(Prisma.ModelName).openapi(fieldDesc("Tên model Prisma.")),
    operation: z.string().openapi(fieldDesc("Tên thao tác (create, update, delete, ...).")),
    data: z.any().openapi(fieldDesc("Dữ liệu truyền vào thao tác.")),
  })
  .openapi("SqlTransactionItem")

const app = new OpenAPIHono({ strict: false })
app.openapi(
  createRoute({
    operationId: "sqlTransaction",
    tags: ["SQL Transaction"],
    summary: "Thực thi batch thao tác Prisma trong transaction",
    path: "/transaction",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.array(SqlTransactionItemSchema),
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(z.any()), "Kết quả từng thao tác trong transaction"),
      500: {
        description: "Model hoặc operation không tồn tại",
        content: { "application/json": { schema: ErrorMessageResponseSchema } },
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
