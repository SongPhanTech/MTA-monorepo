import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { enrollApprovedRegistrations } from "../services/enroll-approved-registrations"
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

const enrollApprovedStudentsRoute = createRoute({
  operationId: "enrollApprovedStudents",
  tags: ["Đợt đăng ký học"],
  path: "/enroll-approved-students",
  method: "post",
  summary: "Đưa SV đã chấp thuận vào lớp môn học",
  description: `Tạo StudentSubjectScore còn thiếu cho các đơn ClassRegisterLogs ở trạng thái SUCCESS (Được chấp thuận) trong đợt.

Idempotent: bỏ qua SV đã có trong lớp. Đồng bộ enrolledCount của SubjectClass.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học")),
            })
            .openapi("EnrollApprovedStudentsRequest"),
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
          schema: z
            .object({
              message: z.string(),
              created: z.number(),
              alreadyEnrolled: z.number(),
              skippedMissingFk: z.number(),
              byClass: z.array(
                z.object({
                  subjectClassId: z.string(),
                  created: z.number(),
                })
              ),
            })
            .openapi("EnrollApprovedStudentsResponse"),
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

app.openapi(enrollApprovedStudentsRoute, async (c) => {
  const { classRegisterSessionId } = c.req.valid("json")
  if (!classRegisterSessionId) {
    return c.json({ message: "Thiếu classRegisterSessionId" }, 400)
  }
  try {
    const result = await enrollApprovedRegistrations(classRegisterSessionId)
    return c.json(result, 200)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Đưa SV vào lớp thất bại"
    return c.json({ message: msg }, 400)
  }
})

export default app
