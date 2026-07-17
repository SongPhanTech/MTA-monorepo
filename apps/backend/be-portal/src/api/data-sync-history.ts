import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { models } from "@workspace/db/zod"
import {
  createDataSyncHistoryPending,
  listDataSyncHistory,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"

const app = new OpenAPIHono({ strict: false })

const getDataSyncHistory = createRoute({
  operationId: "get-data-sync-history",
  path: "/get-data-sync-history",
  tags: ["DataSync"],
  summary: "Lấy lịch sử đồng bộ dữ liệu",
  method: "get",
  request: {
    query: z.object({
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .openapi({ description: "Số bản ghi" }),
    }),
  },
  responses: {
    200: {
      description: "Danh sách lịch sử đồng bộ",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              type: z.nativeEnum($Enums.DataSyncType),
              status: z.nativeEnum($Enums.DataSyncStatus),
              sessionName: z.string(),
              fileName: z.string().nullable(),
              fileVersion: z.string().nullable(),
              errorMessage: z.string().nullable(),
              createdAt: z.coerce.date(),
              classRegisterSessionId: z.string().nullable(),
            })
          ),
        },
      },
    },
  },
})

app.openapi(getDataSyncHistory, async (c) => {
  const { limit } = c.req.valid("query")
  const items = await listDataSyncHistory(limit ?? 50)
  return c.json(items, 200)
})

const startDataSync = createRoute({
  operationId: "start-data-sync",
  path: "/start-data-sync",
  tags: ["DataSync"],
  summary: "Ghi nhận bắt đầu đồng bộ dữ liệu",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            type: z.nativeEnum($Enums.DataSyncType),
            sessionName: z.string(),
            classRegisterSessionId: z.string().optional(),
            fileName: z.string().optional(),
            fileVersion: z.string().optional(),
            sourceExportedAt: z.string().datetime().optional(),
            recordCounts: z.record(z.string(), z.number()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đã tạo bản ghi lịch sử",
      content: {
        "application/json": {
          schema: models.DataSyncHistoryScalarSchema.pick({ id: true, status: true }),
        },
      },
    },
  },
})

app.openapi(startDataSync, async (c) => {
  const session = c.get("user")
  const body = c.req.valid("json")

  const record = await createDataSyncHistoryPending({
    ...body,
    sourceExportedAt: body.sourceExportedAt ? new Date(body.sourceExportedAt) : undefined,
    performedById: session.id,
  })

  return c.json({ id: record.id, status: record.status }, 200)
})

const finishDataSync = createRoute({
  operationId: "finish-data-sync",
  path: "/finish-data-sync",
  tags: ["DataSync"],
  summary: "Cập nhật kết quả đồng bộ dữ liệu",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            status: z.enum(["SUCCESS", "FAILED"]),
            errorMessage: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Đã cập nhật",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(finishDataSync, async (c) => {
  const { id, status, errorMessage } = c.req.valid("json")

  if (status === "SUCCESS") {
    await markDataSyncHistorySuccess(id)
  } else {
    await markDataSyncHistoryFailed(id, errorMessage ?? "Đồng bộ thất bại")
  }

  return c.json({ message: "success" }, 200)
})

export default app
