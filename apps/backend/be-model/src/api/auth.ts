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
    const cookieKey = `x-token-${getAppCode}`

    const authHeader = c.req.header("Authorization")
    const headerToken = authHeader?.split(" ")[1]
    const cookieToken = getCookie(c, cookieKey)
    const xToken = headerToken || cookieToken

    const tenantCode = getCookie(c, "x-tenantcode") || "dev"
    const reqCookie = c.req.header("Cookie") || ""

    console.log("[get-session] ========== REQUEST ==========")
    console.log("[get-session] appCode (query):", appCode)
    console.log("[get-session] appCode (normalized):", getAppCode)
    console.log("[get-session] cookieKey:", cookieKey)
    console.log("[get-session] tenantCode:", tenantCode)
    console.log("[get-session] tokenSource:", headerToken ? "Authorization header" : cookieToken ? "cookie" : "none")
    console.log("[get-session] Authorization header:", authHeader ?? "(empty)")
    console.log("[get-session] xToken:", xToken ?? "(empty)")
    console.log("[get-session] reqCookie:", reqCookie || "(empty)")

    if (!xToken) {
      console.log("[get-session] ========== RESPONSE 401 (no token) ==========")
      return c.json({ error: "Unauthorized" }, 401)
    }

    const cookie = headerToken ? `x-tenantcode=dev; ${cookieKey}=${xToken}` : reqCookie
    console.log("[get-session] cookie forwarded to SSO:", cookie)

    const session = await auth({ xToken, appCode: getAppCode, tenantCode, cookie })

    if (!session) {
      console.log("[get-session] ========== RESPONSE 401 (auth failed) ==========")
      return c.json({ error: "Unauthorized" }, 401)
    }

    console.log("[get-session] ========== RESPONSE 200 ==========")
    console.log("[get-session] session:", JSON.stringify(session, null, 2))
    return c.json(session, 200)
  }
)

export default app
