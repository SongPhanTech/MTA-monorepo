import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { fetchSystemUserPermission } from "../utils/system-client"

const app = new OpenAPIHono({ strict: false })

const PermissionItemSchema = z
  .object({
    sFormName: z.string().nullish().openapi(fieldDesc("Mã chức năng")),
    lPermission: z.number().nullish().openapi(fieldDesc("Bit quyền")),
    sTen: z.string().nullish().openapi(fieldDesc("Tên chức năng")),
    PermissionNames: z.array(z.string()).nullish().openapi(fieldDesc("Tên quyền")),
  })
  .openapi("GetPermissionItem")

const RoleItemSchema = z
  .object({
    sRoleId: z.string().nullish(),
    sCodeName: z.string().nullish(),
    sRoleName: z.string().nullish(),
    sVersion: z.string().nullish(),
    Permissions: z.array(PermissionItemSchema).nullish(),
  })
  .openapi("GetPermissionRole")

const GetPermissionBodySchema = z
  .object({
    appCode: z.string().min(1).openapi(fieldDesc("Mã ứng dụng, vd. congsinhvien, lms")),
    userId: z.string().min(1).openapi(fieldDesc("ID người dùng")),
  })
  .openapi("GetPermissionBody")

const GetPermissionResponseSchema = z
  .object({
    Roles: z.array(RoleItemSchema).nullish(),
    Permissions: z.array(PermissionItemSchema).nullish(),
  })
  .openapi("GetPermissionResponse")

const getPermissionRoute = createRoute({
  operationId: "getPermission",
  path: "/",
  method: "post",
  tags: ["Phân quyền"],
  summary: "Lấy quyền theo appCode + userId",
  description: `FE chỉ gọi endpoint này trên be-model (POST). BE gọi system public-api theo \`SYSTEM_BASE_URL\`.

**Body:** appCode, userId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetPermissionBodySchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Danh sách quyền / vai trò",
      content: {
        "application/json": {
          schema: GetPermissionResponseSchema,
        },
      },
    },
    401: {
      description: "Thiếu hoặc sai client system",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getPermissionRoute, async (c) => {
  const { appCode, userId } = c.req.valid("json")
  try {
    const { status, data } = await fetchSystemUserPermission(appCode, userId)
    if (status >= 200 && status < 300) {
      return c.json(data as z.infer<typeof GetPermissionResponseSchema>, 200)
    }
    const message =
      (data as { message?: string; title?: string })?.message ||
      (data as { title?: string })?.title ||
      "Không lấy được quyền người dùng"
    if (status === 401) return c.json({ message: String(message) }, 401)
    if (status === 400 || status === 403 || status === 404) {
      return c.json({ message: String(message) }, status as 400 | 403 | 404)
    }
    return c.json({ message: String(message) }, 500)
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    const status = err.status === 401 ? 401 : 500
    console.error("[getPermission]", err.message || error)
    return c.json({ message: err.message || "Lỗi lấy quyền" }, status)
  }
})

export default app
