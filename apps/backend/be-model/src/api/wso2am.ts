import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { PrismaClient as MysqlPrismaClient } from "@workspace/db/mysql"
import { fieldDesc } from "../dto/openapi-helpers"
import { jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"

const Wso2ApplicationSchema = z
  .object({
    APPLICATION_ID: z.number().openapi(fieldDesc("ID ứng dụng.")),
    NAME: z.string().openapi(fieldDesc("Tên ứng dụng.")),
    SUBSCRIBER_ID: z.number().openapi(fieldDesc("ID subscriber.")),
    APPLICATION_TIER: z.string().openapi(fieldDesc("Tier ứng dụng.")),
    CALLBACK_URL: z.null().openapi(fieldDesc("Callback URL.")),
    DESCRIPTION: z.string().openapi(fieldDesc("Mô tả.")),
    APPLICATION_STATUS: z.string().openapi(fieldDesc("Trạng thái.")),
    GROUP_ID: z.null().openapi(fieldDesc("Group ID.")),
    CREATED_BY: z.string().openapi(fieldDesc("Người tạo.")),
    CREATED_TIME: z.string().openapi(fieldDesc("Thời gian tạo.")),
    UPDATED_BY: z.null().openapi(fieldDesc("Người cập nhật.")),
    UPDATED_TIME: z.string().openapi(fieldDesc("Thời gian cập nhật.")),
    UUID: z.string().openapi(fieldDesc("UUID ứng dụng.")),
    TOKEN_TYPE: z.string().openapi(fieldDesc("Loại token.")),
    ORGANIZATION: z.string().openapi(fieldDesc("Tổ chức.")),
    SHARED_ORGANIZATION: z.string().openapi(fieldDesc("Tổ chức chia sẻ.")),
  })
  .openapi("Wso2Application")

const app = new OpenAPIHono({ strict: false })

app.openapi(
  createRoute({
    operationId: "applications",
    tags: ["WSO2 AM"],
    summary: "Tìm kiếm ứng dụng trên WSO2 API Manager",
    path: "/applications",
    method: "get",
    request: {
      query: z.object({
        search: z.string().optional().openapi(fieldDesc("Từ khóa tìm theo tên ứng dụng.")),
      }),
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(Wso2ApplicationSchema), "Danh sách ứng dụng WSO2 AM"),
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
