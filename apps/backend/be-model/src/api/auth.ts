import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { auth } from "@workspace/auth/server"
import { getCookie } from "hono/cookie"
import { UnauthorizedResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { sessionSchema } from "../dto/auth"

const app = new OpenAPIHono({ strict: false })

app.openapi(
  createRoute({
    operationId: "get-session",
    tags: ["Xác thực"],
    summary: "Lấy thông tin phiên đăng nhập",
    path: "/get-session",
    method: "get",
    request: {
      query: z.object({
        appCode: z.string().openapi(fieldDesc("Mã ứng dụng (lms, ems, hrm, ...).", "lms")),
      }),
    },
    responses: {
      ...standardErrorResponses(),
      200: {
        content: { "application/json": { schema: sessionSchema } },
        description: "Lấy phiên thành công",
      },
      401: {
        content: { "application/json": { schema: UnauthorizedResponseSchema } },
        description: "Chưa đăng nhập hoặc token không hợp lệ",
      },
    },
  }),
  async (c) => {
    const { appCode } = c.req.valid("query")

    const getAppCode = appCode.toLowerCase()

    const headerToken = c.req.header("Authorization")?.split(" ")[1]
    const xToken = headerToken || getCookie(c, `x-token-${getAppCode}`)

    const tenantCode = getCookie(c, "x-tenantcode") || "dev"
    const reqCookie = c.req.header("Cookie") || ""

    console.log("[get-session].xToken", xToken)
    console.log("[get-session].appCode", getAppCode)
    if (!xToken) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const cookie = headerToken ? `x-tenantcode=dev; x-token-${getAppCode}=${xToken}` : reqCookie

    const session = await auth({ xToken, appCode, tenantCode, cookie })
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401)
    }
    return c.json(session, 200)
  }
)

export default app
