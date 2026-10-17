import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { createDataSyncHistoryPending, findOtherPendingImport } from "../services/data-sync-history"
import { saveImportFile } from "../services/data-sync/import-file-store"
import { DATA_SYNC_KAFKA_ENABLED, enqueueDataSyncImport } from "../services/data-sync/kafka-queue"
import { runImportTrainingDataJobFromFile } from "../services/import-training-data"

const app = new OpenAPIHono({ strict: false })

const importFromInternal = createRoute({
  operationId: "import-from-internal",
  path: "/import-from-internal",
  tags: ["DataSync"],
  summary: "Nhập dữ liệu từ file JSON xuất bởi phần mềm nội bộ (bất đồng bộ)",
  description:
    "Nhận file, ghi PENDING, đẩy Kafka (worker import). Kafka tắt → fallback in-process. Theo dõi qua get-data-sync-history.",
  method: "post",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.instanceof(File).openapi({
              type: "string",
              format: "binary",
              description: "File JSON export từ QL đào tạo",
            }),
            syncHistoryId: z.string().optional().openapi({
              description: "ID bản ghi DataSyncHistory đã tạo từ FE (optional)",
            }),
          }),
        },
      },
    },
  },
  responses: {
    202: {
      description: "Đã nhận file, đang nhập nền",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            syncHistoryId: z.string(),
            status: z.literal("PENDING"),
          }),
        },
      },
    },
    200: {
      description: "Import thành công (tương thích cũ, không còn dùng)",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            sessionId: z.string().optional(),
            sessionName: z.string().optional(),
            steps: z
              .array(
                z.object({
                  table: z.string(),
                  count: z.number(),
                })
              )
              .optional(),
            warnings: z.array(z.string()).optional(),
            syncHistoryId: z.string().optional(),
            status: z.string().optional(),
          }),
        },
      },
    },
    400: {
      description: "File không hợp lệ",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    409: {
      description: "Đang có tiến trình nhập khác",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(importFromInternal, async (c) => {
  const session = c.get("user")
  const form = c.req.valid("form")
  const file = form.file
  let syncHistoryId = form.syncHistoryId

  if (!file || file.size === 0) {
    return c.json({ message: "Vui lòng chọn file JSON" }, 400)
  }

  const otherPending = await findOtherPendingImport(syncHistoryId)
  if (otherPending) {
    return c.json(
      {
        message: `Đang có một tiến trình nhập dữ liệu (${otherPending.sessionName || otherPending.fileName || otherPending.id}). Vui lòng đợi hoàn tất.`,
      },
      409
    )
  }

  if (!syncHistoryId) {
    const history = await createDataSyncHistoryPending({
      type: $Enums.DataSyncType.IMPORT,
      sessionName: file.name || "Import JSON",
      fileName: file.name,
      performedById: session.id,
    })
    syncHistoryId = history.id
  }

  const historyId = syncHistoryId
  const filePath = await saveImportFile(historyId, Buffer.from(await file.arrayBuffer()))

  if (DATA_SYNC_KAFKA_ENABLED) {
    const enqueued = await enqueueDataSyncImport({
      syncHistoryId: historyId,
      filePath,
      fileName: file.name,
      timestamp: new Date().toISOString(),
      attempts: 0,
    })
    if (enqueued) {
      return c.json(
        {
          message: "Đã nhận file. Worker đang nhập dữ liệu, theo dõi tab Lịch sử đồng bộ.",
          syncHistoryId: historyId,
          status: "PENDING" as const,
        },
        202
      )
    }
    console.warn("[data-sync] Kafka không khả dụng → fallback import in-process")
  }

  setTimeout(() => {
    runImportTrainingDataJobFromFile(historyId, filePath)
  }, 50)

  return c.json(
    {
      message: "Đã nhận file. Hệ thống đang nhập dữ liệu nền, theo dõi tab Lịch sử đồng bộ.",
      syncHistoryId: historyId,
      status: "PENDING" as const,
    },
    202
  )
})

export default app
