import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { PrismaClient as MysqlPrismaClient } from "@workspace/db/mysql"

const app = new OpenAPIHono({ strict: false })

app.openapi(
  createRoute({
    operationId: "applications",
    path: "/applications",
    method: "get",
    request: {
      query: z.object({
        search: z.string().optional(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                APPLICATION_ID: z.number(),
                NAME: z.string(),
                SUBSCRIBER_ID: z.number(),
                APPLICATION_TIER: z.string(),
                CALLBACK_URL: z.null(),
                DESCRIPTION: z.string(),
                APPLICATION_STATUS: z.string(),
                GROUP_ID: z.null(),
                CREATED_BY: z.string(),
                CREATED_TIME: z.string(),
                UPDATED_BY: z.null(),
                UPDATED_TIME: z.string(),
                UUID: z.string(),
                TOKEN_TYPE: z.string(),
                ORGANIZATION: z.string(),
                SHARED_ORGANIZATION: z.string(),
              })
            ),
          },
        },
        description: "Successfully",
      },
    },
  }),
  async (c) => {
    const { search } = c.req.valid("query")
    const mysqlPrisma = new MysqlPrismaClient({
      datasourceUrl: process.env.WSO2AM_DB,
    })
    const res = await mysqlPrisma.$queryRaw<any[]>`select *
                    from WSO2AM_DB.AM_APPLICATION
                    where NAME like ${`%${search || ""}%`}`
    return c.json(res, 200)
  }
)

export default app
