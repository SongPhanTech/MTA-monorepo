import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { assignDelegation, listDelegatedPermissions } from "../services/access-delegation"
import { fetchUserPermissions } from "../services/user-permissions"

const app = new OpenAPIHono({ strict: false })

const PermissionSchema = z
  .object({
    sFormName: z.string().nullish().openapi(fieldDesc("Mã chức năng")),
    sTen: z.string().nullish().openapi(fieldDesc("Tên chức năng")),
    lPermission: z.number().nullish().openapi(fieldDesc("Tổng quyền bitwise")),
    PermissionNames: z.array(z.string()).nullish().openapi(fieldDesc("Tên các quyền đang bật")),
  })
  .openapi("UserPermissionItem")

const RoleSchema = z
  .object({
    sRoleId: z.string().nullish().openapi(fieldDesc("ID vai trò")),
    sCodeName: z.string().nullish().openapi(fieldDesc("Mã vai trò")),
    sRoleName: z.string().nullish().openapi(fieldDesc("Tên vai trò")),
    sVersion: z.string().nullish().openapi(fieldDesc("Phiên bản vai trò")),
    Permissions: z.array(PermissionSchema).openapi(fieldDesc("Danh sách quyền của vai trò")),
  })
  .openapi("UserPermissionRole")

const UserPermissionSchema = z
  .object({
    UserId: z.string().openapi(fieldDesc("ID người dùng")),
    Roles: z.array(RoleSchema).openapi(fieldDesc("Danh sách vai trò kèm quyền")),
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

const AssignPermissionSchema = z
  .object({
    sFormName: z.string().min(1).openapi(fieldDesc("Mã chức năng")),
    lPermission: z.number().int().nonnegative().openapi(fieldDesc("Bit quyền đã chọn")),
  })
  .openapi("AssignPermissionInput")

const AssignGrantSchema = z
  .object({
    sRoleId: z.string().min(1).openapi(fieldDesc("ID vai trò trên system")),
    permissions: z.array(AssignPermissionSchema).openapi(fieldDesc("Quyền đã tick trong vai trò")),
  })
  .openapi("AssignGrantInput")

const AssignDelegationBodySchema = z
  .object({
    recipientIds: z
      .array(z.string().min(1))
      .min(1)
      .max(50)
      .openapi(fieldDesc("Id hồ sơ cán bộ hoặc giảng viên nhận ủy quyền")),
    grants: z.array(AssignGrantSchema).min(1).max(50).openapi(fieldDesc("Vai trò và bit quyền được giao")),
    granterId: z
      .string()
      .min(1)
      .optional()
      .openapi(fieldDesc("Id hồ sơ người giao. Dùng khi request chưa gắn jwt.")),
  })
  .openapi("AssignDelegationBody")

const AssignDelegationResultSchema = z
  .object({
    assigned: z.number().openapi(fieldDesc("Số người nhận đã ghi")),
    skippedRecipientIds: z.array(z.string()).openapi(fieldDesc("Người nhận không hợp lệ")),
    skippedRoleIds: z.array(z.string()).openapi(fieldDesc("Vai trò người giao không có")),
  })
  .openapi("AssignDelegationResult")

const DelegatedPermissionSchema = z
  .object({
    name: z.string().openapi(fieldDesc("Mã chức năng")),
    permission: z.number().openapi(fieldDesc("Bit quyền sau khi OR")),
  })
  .openapi("DelegatedPermission")

const assignDelegationRoute = createRoute({
  operationId: "assign-delegation",
  path: "/assign",
  method: "post",
  tags: ["Ủy quyền"],
  summary: "Gán vai trò và bit quyền cho cán bộ hoặc giảng viên",
  description:
    "Chỉ ghi bit người giao đang có. Tick Thêm hoặc Sửa thì kèm bit Xem nếu người giao có Xem. Ghi AccessRoleGrant và AccessPermissionGrant.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AssignDelegationBodySchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đã ghi ủy quyền",
      content: {
        "application/json": {
          schema: AssignDelegationResultSchema,
        },
      },
    },
    401: {
      description: "Chưa đăng nhập",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

const getDelegatedPermissions = createRoute({
  operationId: "get-delegated-permissions",
  path: "/delegated",
  method: "get",
  tags: ["Ủy quyền"],
  summary: "Quyền được ủy quyền của user",
  description:
    "OR bit theo mã chức năng từ các AccessPermissionGrant còn hiệu lực. Không trả 401 để menu localhost không bị coi là hết phiên.",
  request: {
    query: z.object({
      userId: z.string().optional().openapi(fieldDesc("Id hồ sơ. Dùng khi request chưa gắn jwt.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Danh sách quyền đã gộp",
      content: {
        "application/json": {
          schema: z.object({
            permissions: z.array(DelegatedPermissionSchema),
          }),
        },
      },
    },
    401: {
      description: "Chưa đăng nhập",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(assignDelegationRoute, async (c) => {
  const body = c.req.valid("json")
  const userId = c.get("user")?.id || body.granterId
  if (!userId) {
    return c.json({ message: "Chưa xác định được người giao" }, 400)
  }

  try {
    const result = await assignDelegation(userId, body.recipientIds, body.grants)
    return c.json(result, 200)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không gán được quyền"
    console.error("[user-permissions] assign failed", message)
    return c.json({ message }, 400)
  }
})

app.openapi(getDelegatedPermissions, async (c) => {
  const userId = c.get("user")?.id || c.req.valid("query").userId
  if (!userId) {
    return c.json({ permissions: [] }, 200)
  }

  try {
    const permissions = await listDelegatedPermissions(userId)
    return c.json({ permissions }, 200)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không lấy được quyền được ủy quyền"
    console.error("[user-permissions] delegated failed", message)
    return c.json({ message }, 500)
  }
})

export default app
