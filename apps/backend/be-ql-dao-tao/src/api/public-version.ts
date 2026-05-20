import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { z } from "zod"
import { getVersionApps } from "../services/version-service"
import { APP_SECRET_MAP } from "../config/mta.config"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono()

const getVersionRoute = createRoute({
  operationId: "getVersion",
  tags: ["Version"],
  method: "get",
  path: "/{appCode}",
  summary: "Phiên bản ứng dụng MTA",
  description: `Lấy thông tin phiên bản client từ dịch vụ MTA theo mã ứng dụng.

**Bảng dữ liệu nguồn:** không dùng Prisma (gọi API MTA).

**Tham số:** appCode — mã ứng dụng (path).`,
  request: {
    params: z.object({
      appCode: z.string().openapi({
        param: { name: "appCode", in: "path" },
        ...fieldDesc("Mã ứng dụng (khóa trong APP_SECRET_MAP).", "ql-dao-tao"),
      }),
    }),
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.any().openapi({ description: "Payload phiên bản từ MTA." }),
        },
      },
    },
    400: {
      description: "Mã ứng dụng không hợp lệ",
      content: {
        "application/json": {
          schema: z.object({
            message: z.union([z.string(), z.array(z.any())]).openapi(fieldDesc("Chi tiết lỗi.")),
          }),
        },
      },
    },
  },
})

app.openapi(getVersionRoute, async (c) => {
  const { appCode } = c.req.valid("param")
  const secret = APP_SECRET_MAP[appCode]
  if (!secret || !secret.clientId || !secret.secretKey) {
    return c.json(
      {
        message: [
          { message: "Invalid appCode or missing secret:  " + secret },
          { message: "AppCode: " + appCode },
        ],
      },
      400
    )
  }

  const data = await getVersionApps(secret.clientId, secret.secretKey)

  return c.json(data)
})

export default app
