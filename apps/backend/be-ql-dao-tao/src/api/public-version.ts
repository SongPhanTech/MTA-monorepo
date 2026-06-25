import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { z } from "zod"
import { getVersionApps } from "../services/version-service"
import { APP_SECRET_MAP } from "../config/mta.config"
import { fieldDesc } from "../dto/openapi-helpers"
import {
  VersionAppErrorResponseSchema,
  VersionAppResponseSchema,
} from "../dto/student-result-openapi.dto"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const getVersionRoute = createRoute({
  operationId: "getVersion",
  tags: ["Phiên bản ứng dụng"],
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
    ...standardErrorResponses(),
    200: {
      description: "Lấy phiên bản thành công",
      content: {
        "application/json": {
          schema: VersionAppResponseSchema,
        },
      },
    },
    400: {
      description: "Mã ứng dụng không hợp lệ hoặc thiếu cấu hình secret",
      content: {
        "application/json": {
          schema: VersionAppErrorResponseSchema,
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
