import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import {
  createDataSyncHistoryPending,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"
import { importTrainingDataFromJson } from "../services/import-training-data"

const app = new OpenAPIHono({ strict: false })

const importFromInternal = createRoute({
  operationId: "import-from-internal",
  path: "/import-from-internal",
  tags: ["DataSync"],
  summary: "Nhập dữ liệu từ file JSON xuất bởi phần mềm nội bộ",
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
    200: {
      description: "Import thành công",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            sessionId: z.string(),
            sessionName: z.string(),
            steps: z.array(
              z.object({
                table: z.string(),
                count: z.number(),
              })
            ),
            warnings: z.array(z.string()),
            syncHistoryId: z.string().optional(),
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

  let payload: unknown
  try {
    const text = await file.text()
    payload = JSON.parse(text)
  } catch {
    return c.json({ message: "File JSON không hợp lệ" }, 400)
  }

  const preview = payload as {
    version?: string
    exportedAt?: string
    counts?: Record<string, number>
    data?: { ClassRegisterSession?: Array<{ id?: string; name?: string }> }
  }
  const sessionRow = preview.data?.ClassRegisterSession?.[0]

  if (!syncHistoryId) {
    const history = await createDataSyncHistoryPending({
      type: $Enums.DataSyncType.IMPORT,
      sessionName: sessionRow?.name || file.name,
      classRegisterSessionId: sessionRow?.id,
      fileName: file.name,
      fileVersion: preview.version,
      sourceExportedAt: preview.exportedAt ? new Date(preview.exportedAt) : undefined,
      recordCounts: preview.counts,
      performedById: session.id,
    })
    syncHistoryId = history.id
  }

  try {
    const result = await importTrainingDataFromJson(payload)
    await markDataSyncHistorySuccess(syncHistoryId)

    return c.json(
      {
        message: "Nhập dữ liệu thành công",
        sessionId: result.sessionId,
        sessionName: result.sessionName,
        steps: result.steps,
        warnings: result.warnings,
        syncHistoryId,
      },
      200
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nhập dữ liệu thất bại"
    await markDataSyncHistoryFailed(syncHistoryId, message)
    return c.json({ message }, 400)
  }
})

export default app
