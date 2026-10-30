import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import {
  createDataSyncHistoryPending,
  markDataSyncHistoryFailed,
  markDataSyncHistorySuccess,
} from "../services/data-sync-history"
import { packSyncPayload, SYNC_FILE_EXT } from "../services/data-sync-pack"
import { exportRegistrationResults } from "../services/export-registration-results"

const app = new OpenAPIHono({ strict: false })

const exportToInternal = createRoute({
  operationId: "export-to-internal",
  path: "/export-to-internal",
  tags: ["DataSync"],
  summary: "Xuất kết quả đăng ký học về phần mềm nội bộ (.dat)",
  description:
    "Xuất ClassRegisterLogs, StudentSubjectScore và dữ liệu liên quan của 1 đợt đăng ký thành gói .dat (Gzip + AES-256-GCM).",
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
      description: "Meta + gói .dat (base64)",
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
            fileName: z.string(),
            fileBase64: z.string(),
            fileSize: z.number(),
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

    const safeName = (result.meta.sessionName || "dot-dang-ky").replace(/[\\/:*?"<>|]/g, "_").trim()
    const fileName = `export-ket-qua-dang-ky-${safeName}${SYNC_FILE_EXT}`

    // Không trả plaintext data — chỉ gói mã hóa
    const packed = packSyncPayload(JSON.stringify(result))
    const publicMeta = {
      version: result.version,
      type: result.type,
      exportedAt: result.exportedAt,
      filters: result.filters,
      meta: result.meta,
      counts: result.counts,
    }

    if (!syncHistoryId) {
      const history = await createDataSyncHistoryPending({
        type: $Enums.DataSyncType.EXPORT,
        sessionName: result.meta.sessionName,
        classRegisterSessionId,
        fileName,
        fileVersion: result.version,
        recordCounts: result.counts,
        performedById: user.id,
      })
      syncHistoryId = history.id
    }

    const TABLE_DISPLAY_NAMES: Record<string, string> = {
      ClassRegisterLogs: "Nhật ký đăng ký học",
      StudentSubjectScore: "Điểm môn học sau đăng ký",
      Student: "Sinh viên",
      UserProfile: "Hồ sơ liên quan",
      SubjectClass: "Lớp học phần đã đăng ký",
      SubjectVersion: "Môn học",
      ClassRegisterSession: "Thông tin đợt đăng ký",
      Semester: "Học kỳ",
      SchoolYear: "Năm học",
    }

    const exportedCount = Object.values(result.counts).reduce((total, count) => total + count, 0)
    const countDetail = Object.entries(result.counts)
      .filter(([name]) => !name.startsWith("_"))
      .map(([name, count]) => `${TABLE_DISPLAY_NAMES[name] || name}: ${count}`)
      .join(", ")
    await markDataSyncHistorySuccess(syncHistoryId, {
      description: `Đã xuất thành công ${exportedCount} bản ghi${countDetail ? ` (${countDetail})` : ""}.`,
      recordCounts: {
        ...result.counts,
        categories: Object.keys(result.counts)
          .filter((name) => !name.startsWith("_"))
          .map((name) => ({
            key: name,
            label: TABLE_DISPLAY_NAMES[name] || name,
          })),
      },
    })

    return c.json(
      {
        ...publicMeta,
        fileName,
        fileBase64: packed.toString("base64"),
        fileSize: packed.byteLength,
        syncHistoryId,
      },
      200
    )
  } catch {
    const message = "Không xuất được dữ liệu"
    if (syncHistoryId) {
      await markDataSyncHistoryFailed(syncHistoryId, message)
    }
    return c.json({ message }, 400)
  }
})

export default app
