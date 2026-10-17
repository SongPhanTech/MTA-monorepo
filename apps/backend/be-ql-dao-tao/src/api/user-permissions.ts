import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import {
  applyActualRolePermissions,
  assignDelegation,
  fetchUserPermissions,
  listDelegatedPermissions,
  listGrantedRoles,
  revokeGrants,
} from "../services/access-delegation"

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
    const data = await applyActualRolePermissions(await fetchUserPermissions(body.UserIds))
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
    grants: z
      .array(AssignGrantSchema)
      .min(1)
      .max(50)
      .openapi(fieldDesc("Vai trò và bit quyền được giao")),
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

const GrantedPermissionSchema = z
  .object({
    sFormName: z.string().openapi(fieldDesc("Mã chức năng")),
    sTen: z.string().nullable().openapi(fieldDesc("Tên chức năng")),
    lPermission: z.number().openapi(fieldDesc("Bit quyền đã giao")),
  })
  .openapi("GrantedPermission")

const GrantedRoleSchema = z
  .object({
    id: z.string().openapi(fieldDesc("Id lần giao")),
    recipientId: z.string().openapi(fieldDesc("Id người nhận")),
    fullname: z.string().nullable().openapi(fieldDesc("Họ tên người nhận")),
    code: z.string().nullable().openapi(fieldDesc("Mã hồ sơ")),
    officerNumber: z.string().nullable().openapi(fieldDesc("Số hiệu")),
    sRoleId: z.string().openapi(fieldDesc("ID vai trò")),
    sRoleName: z.string().nullable().openapi(fieldDesc("Tên vai trò")),
    sCodeName: z.string().nullable().openapi(fieldDesc("Mã vai trò")),
    permissions: z.array(GrantedPermissionSchema).openapi(fieldDesc("Quyền đang giao")),
    createdAt: z.string().openapi(fieldDesc("Thời điểm giao")),
  })
  .openapi("GrantedRole")

const listGrantedRolesRoute = createRoute({
  operationId: "list-granted-roles",
  path: "/grants",
  method: "get",
  tags: ["Ủy quyền"],
  summary: "Danh sách quyền người đang đăng nhập đã giao",
  description: "Chỉ các AccessRoleGrant còn hiệu lực do người giao này tạo.",
  request: {
    query: z.object({
      granterId: z
        .string()
        .optional()
        .openapi(fieldDesc("Id hồ sơ người giao. Dùng khi request chưa gắn jwt.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Danh sách lần giao còn hiệu lực",
      content: {
        "application/json": {
          schema: z.object({
            grants: z.array(GrantedRoleSchema),
          }),
        },
      },
    },
  },
})

const RevokeGrantsBodySchema = z
  .object({
    grantIds: z
      .array(z.string().min(1))
      .min(1)
      .max(50)
      .openapi(fieldDesc("Id các lần giao cần thu hồi")),
    granterId: z
      .string()
      .min(1)
      .optional()
      .openapi(fieldDesc("Id hồ sơ người giao. Dùng khi request chưa gắn jwt.")),
  })
  .openapi("RevokeGrantsBody")

const revokeGrantsRoute = createRoute({
  operationId: "revoke-grants",
  path: "/revoke",
  method: "post",
  tags: ["Ủy quyền"],
  summary: "Thu hồi quyền đã giao",
  description: "Chỉ thu hồi lần giao của chính người gọi. Người nhận mất các bit của lần giao đó.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RevokeGrantsBodySchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đã thu hồi",
      content: {
        "application/json": {
          schema: z.object({
            revoked: z.number().openapi(fieldDesc("Số lần giao đã thu hồi")),
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

app.openapi(listGrantedRolesRoute, async (c) => {
  const granterId = c.get("user")?.id || c.req.valid("query").granterId
  if (!granterId) {
    return c.json({ grants: [] }, 200)
  }

  try {
    const grants = await listGrantedRoles(granterId)
    return c.json({ grants }, 200)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không lấy được danh sách đã ủy quyền"
    console.error("[user-permissions] grants failed", message)
    return c.json({ message }, 500)
  }
})

app.openapi(revokeGrantsRoute, async (c) => {
  const body = c.req.valid("json")
  const granterId = c.get("user")?.id || body.granterId
  if (!granterId) {
    return c.json({ message: "Chưa xác định được người giao" }, 400)
  }

  try {
    const result = await revokeGrants(granterId, body.grantIds)
    return c.json(result, 200)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thu hồi được quyền"
    console.error("[user-permissions] revoke failed", message)
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
