import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const DEFAULT_MESSAGE = "Hệ thống đang được bảo trì. Vui lòng quay lại sau."

function isMaintenanceEnabled() {
  const value = process.env.SYSTEM_MAINTENANCE?.trim().toLowerCase()
  return value === "true" || value === "1" || value === "yes"
}

const SystemStatusSchema = z
  .object({
    maintenance: z.boolean().openapi(fieldDesc("true = hệ thống đang bảo trì.", false)),
    message: z
      .string()
      .openapi(fieldDesc("Nội dung hiển thị trên màn hình bảo trì.", DEFAULT_MESSAGE)),
  })
  .openapi("SystemStatusResponse")

app.openapi(
  createRoute({
    operationId: "getSystemStatus",
    tags: ["Hệ thống"],
    summary: "Kiểm tra trạng thái bảo trì",
    description: `API công khai. Đọc cờ \`SYSTEM_MAINTENANCE\` trên be-model.

**Tham số:** không có.`,
    path: "/",
    method: "get",
    responses: {
      ...standardErrorResponses(),
      200: {
        description: "Trạng thái hệ thống",
        content: {
          "application/json": {
            schema: SystemStatusSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const maintenance = isMaintenanceEnabled()
    return c.json(
      {
        maintenance,
        message:
          process.env.SYSTEM_MAINTENANCE_MESSAGE?.trim() ||
          (maintenance ? DEFAULT_MESSAGE : "Hệ thống đang hoạt động bình thường."),
      },
      200
    )
  }
)

export default app
