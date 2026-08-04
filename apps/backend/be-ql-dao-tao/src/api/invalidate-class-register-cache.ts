import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { invalidateClassRegisterSessionCache } from "../services/portal-crs-cache"

const app = new OpenAPIHono()

const invalidateCacheRoute = createRoute({
  operationId: "invalidateClassRegisterSessionCache",
  tags: ["Đợt đăng ký học"],
  path: "/invalidate-cache",
  method: "post",
  summary: "Reset cache cổng đăng ký theo đợt",
  description:
    "Xóa Redis cache (portal:crs) sau khi chỉnh sửa đợt đăng ký học để SV thấy thông tin mới ngay.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học")),
            })
            .openapi("InvalidateClassRegisterSessionCacheRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            deleted: z.number(),
            skipped: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(invalidateCacheRoute, async (c) => {
  const { classRegisterSessionId } = c.req.valid("json")
  if (!classRegisterSessionId) {
    return c.json({ message: "Thiếu classRegisterSessionId" }, 400)
  }
  const result = await invalidateClassRegisterSessionCache(classRegisterSessionId)
  return c.json(
    {
      message: result.skipped
        ? "REDIS chưa cấu hình — bỏ qua reset cache"
        : "Đã reset cache đăng ký học",
      deleted: result.deleted,
      skipped: result.skipped,
    },
    200
  )
})

export default app
