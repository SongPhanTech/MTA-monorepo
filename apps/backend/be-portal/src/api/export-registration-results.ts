import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import {
  createDataSyncHistoryPending,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"
import { exportRegistrationResults } from "../services/export-registration-results"

const app = new OpenAPIHono({ strict: false })

const exportToInternal = createRoute({
  operationId: "export-to-internal",
  path: "/export-to-internal",
  tags: ["DataSync"],
  summary: "Xuất kết quả đăng ký học về phần mềm nội bộ",
  description:
    "Xuất ClassRegisterLogs, StudentSubjectScore và dữ liệu liên quan của 1 đợt đăng ký thành file JSON.",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            classRegisterSessionId: z.string(),
            syncHistoryId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Gói JSON kết quả đăng ký",
      content: {
        "application/json": {
          schema: z.object({
            version: z.string(),
            type: z.string(),
            exportedAt: z.string(),
            filters: z.object({
              classRegisterSessionId: z.string(),
              semesterId: z.string(),
            }),
            meta: z.object({
              sessionName: z.string(),
              sessionActive: z.boolean(),
              sessionEnded: z.boolean(),
              startDate: z.string(),
              endDate: z.string(),
              registrationCount: z.number(),
            }),
            counts: z.record(z.string(), z.number()),
            data: z.record(z.string(), z.array(z.any())),
            syncHistoryId: z.string().optional(),
          }),
        },
      },
    },
    400: {
      description: "Lỗi",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(exportToInternal, async (c) => {
  const user = c.get("user")
  const { classRegisterSessionId, syncHistoryId: incomingSyncId } = c.req.valid("json")

  let syncHistoryId = incomingSyncId

  try {
    const result = await exportRegistrationResults(classRegisterSessionId)

    if (!syncHistoryId) {
      const history = await createDataSyncHistoryPending({
        type: $Enums.DataSyncType.EXPORT,
        sessionName: result.meta.sessionName,
        classRegisterSessionId,
        fileName: `export-ket-qua-dang-ky-${result.meta.sessionName}.json`,
        fileVersion: result.version,
        recordCounts: result.counts,
        performedById: user.id,
      })
      syncHistoryId = history.id
    }

    await markDataSyncHistorySuccess(syncHistoryId)

    return c.json(
      {
        ...result,
        syncHistoryId,
      },
      200
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất dữ liệu thất bại"
    if (syncHistoryId) {
      await markDataSyncHistoryFailed(syncHistoryId, message)
    }
    return c.json({ message }, 400)
  }
})

export default app
