import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { createDataSyncHistoryPending, findOtherPendingImport } from "../services/data-sync-history"
import { decodeImportBytes } from "../services/data-sync-pack"
import { saveImportPayload } from "../services/data-sync/import-file-store"
import {
  DATA_SYNC_KAFKA_ENABLED,
  enqueueDataSyncImport,
} from "../services/data-sync/kafka-queue"
import {
  markImportJobProcessing,
  runImportTrainingDataJobFromRedis,
} from "../services/import-training-data"

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
    return c.json({ message: "Không nhập được dữ liệu" }, 400)
  }

  // Giải mã .dat (hoặc parse JSON cũ) để lấy session + phát hiện file hỏng sớm
  const fileBytes = Buffer.from(await file.arrayBuffer())
  let sessionIdFromFile: string | undefined
  let sessionNameFromFile: string | undefined
  try {
    const parsed = decodeImportBytes(fileBytes) as {
      data?: { ClassRegisterSession?: Array<{ id?: string; name?: string }> }
    }
    const s = parsed?.data?.ClassRegisterSession?.[0]
    if (s?.id) sessionIdFromFile = s.id
    if (s?.name) sessionNameFromFile = String(s.name)
  } catch {
    return c.json({ message: "Không nhập được dữ liệu" }, 400)
  }

  // Nếu FE đã tạo history, lấy session từ DB; không thì dùng từ file
  let lockSessionId = sessionIdFromFile
  if (syncHistoryId) {
    try {
      const { prisma } = await import("../prisma")
      const hist = await prisma.dataSyncHistory.findUnique({
        where: { id: syncHistoryId },
        select: { classRegisterSessionId: true },
      })
      if (hist?.classRegisterSessionId) lockSessionId = hist.classRegisterSessionId
    } catch {
      /* ignore */
    }
  }

  const otherPending = await findOtherPendingImport(syncHistoryId, lockSessionId)
  if (otherPending) {
    return c.json(
      {
        message: lockSessionId
          ? `Đang có tiến trình nhập cho cùng đợt đăng ký (${otherPending.sessionName || otherPending.fileName || otherPending.id}). Vui lòng đợi hoàn tất.`
          : `Đang có một tiến trình nhập dữ liệu (${otherPending.sessionName || otherPending.fileName || otherPending.id}). Vui lòng đợi hoàn tất.`,
      },
      409
    )
  }

  if (!syncHistoryId) {
    const history = await createDataSyncHistoryPending({
      type: $Enums.DataSyncType.IMPORT,
      sessionName: sessionNameFromFile || file.name || "Import JSON",
      fileName: file.name,
      classRegisterSessionId: sessionIdFromFile,
      performedById: session.id,
    })
    syncHistoryId = history.id
  }

  const historyId = syncHistoryId
  await saveImportPayload(historyId, fileBytes)
  await markImportJobProcessing(historyId, file.name)

  if (DATA_SYNC_KAFKA_ENABLED) {
    const enqueued = await enqueueDataSyncImport({
      syncHistoryId: historyId,
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
    console.log(`[data-sync] fallback bắt đầu history=${historyId} (redis)`)
    runImportTrainingDataJobFromRedis(historyId)
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
