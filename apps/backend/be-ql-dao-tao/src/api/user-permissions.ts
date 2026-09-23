import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { fetchUserPermissions } from "../services/user-permissions"

const app = new OpenAPIHono({ strict: false })

const RoleSchema = z
  .object({
    sRoleId: z.string().nullish().openapi(fieldDesc("ID vai trò")),
    sCodeName: z.string().nullish().openapi(fieldDesc("Mã vai trò")),
    sRoleName: z.string().nullish().openapi(fieldDesc("Tên vai trò")),
    sVersion: z.string().nullish().openapi(fieldDesc("Phiên bản vai trò")),
  })
  .openapi("UserPermissionRole")

const PermissionSchema = z
  .object({
    sFormName: z.string().nullish().openapi(fieldDesc("Mã chức năng")),
    lPermission: z.number().nullish().openapi(fieldDesc("Tổng quyền bitwise")),
  })
  .openapi("UserPermissionItem")

const UserPermissionSchema = z
  .object({
    UserId: z.string().openapi(fieldDesc("ID người dùng")),
    Roles: z.array(RoleSchema).openapi(fieldDesc("Danh sách vai trò")),
    Permissions: z.array(PermissionSchema).openapi(fieldDesc("Danh sách quyền chức năng")),
  })
  .openapi("UserPermission")

const GetUserPermissionsBodySchema = z
  .object({
    UserIds: z
      .array(z.string().min(1))
      .min(1)
      .max(100)
      .openapi(fieldDesc("Danh sách user id, tối đa 100.")),
  })
  .openapi("GetUserPermissionsBody")

const getUserPermissions = createRoute({
  operationId: "get-user-permissions",
  path: "/permissions",
  method: "post",
  tags: ["Ủy quyền"],
  summary: "Lấy vai trò và quyền theo danh sách user",
  description:
    "Proxy tới system public `POST /UserPermissions/permissions`. FE không gọi trực tiếp system API.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetUserPermissionsBodySchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Danh sách vai trò và quyền theo user",
      content: {
        "application/json": {
          schema: z.array(UserPermissionSchema),
        },
      },
    },
    401: {
      description: "Thiếu hoặc sai thông tin xác thực system API",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getUserPermissions, async (c) => {
  const body = c.req.valid("json")

  try {
    const data = await fetchUserPermissions(body.UserIds)
    return c.json(data, 200)
  } catch (error: any) {
    const status = error?.response?.status
    const upstreamMessage =
      error?.response?.data?.message ||
      error?.response?.data?.title ||
      error?.message ||
      "Không lấy được quyền người dùng"
    console.error("[user-permissions] get failed", upstreamMessage, status)
    if (status === 400) {
      return c.json({ message: String(upstreamMessage) }, 400)
    }
    if (status === 401) {
      return c.json({ message: String(upstreamMessage) }, 401)
    }
    return c.json({ message: String(upstreamMessage) }, 500)
  }
})

export default app
